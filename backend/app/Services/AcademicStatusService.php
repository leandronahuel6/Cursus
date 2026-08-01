<?php

namespace App\Services;

use App\Models\MateriaUsuario;
use App\Models\Carrera;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Servicio centralizado para calcular el estado académico real de un alumno.
 *
 * Actúa como Única Fuente de Verdad para determinar qué materias puede
 * cursar o tiene disponibles, considerando correlatividades. Este servicio
 * es consumido tanto por los controladores de Materias como por el de Horarios,
 * aplicando el principio DRY y evitando duplicar la lógica de negocio.
 */
class AcademicStatusService
{
    /**
     * Retorna el conjunto de materias del usuario enriquecidas con un estado
     * académico computado al vuelo.
     *
     * Para cada materia, el estado puede ser:
     * - 'cursando'   : El alumno la está cursando actualmente.
     * - 'aprobada'   : El alumno ya aprobó el final.
     * - 'regular'    : El alumno regularizó pero aún debe el final.
     * - 'disponible' : La materia está 'libre' pero cumple todas sus correlatividades.
     * - 'libre'      : La materia está sin cursar y le faltan correlativas.
     * - 'bloqueada'  : No cumple las correlatividades requeridas.
     *
     * @param  User  $user  El usuario autenticado para el cual se calcula el estado.
     * @return Collection   Colección de materias con sus estados computados.
     */
    public function getMateriasConEstadoReal(User $user): Collection
    {
        // Obtenemos la carrera del usuario. Fallback a la carrera base del sistema.
        $carrera = Carrera::where('nombre', 'Tecnicatura Universitaria en Programación')->firstOrFail();

        // Cargamos los estados reales del alumno, indexados por materia_id para O(1) lookup.
        $misEstados = MateriaUsuario::where('usuario_id', $user->id)
            ->pluck('estado_historico', 'materia_id');

        // Cargamos todas las materias de la carrera con sus correlatividades en una sola query.
        $todasLasMaterias = $carrera->materias()
            ->with('correlatividades')
            ->orderBy('id')
            ->get();

        // Construimos un mapa de estado por materia_id para evaluar correlatividades.
        $estadosPorId = $todasLasMaterias->mapWithKeys(function ($materia) use ($misEstados) {
            return [$materia->id => $misEstados->get($materia->id, 'libre')];
        });

        return $todasLasMaterias->map(function ($materia) use ($misEstados, $estadosPorId) {
            $estadoGuardado = $misEstados->get($materia->id, 'libre');

            $puedeCursar = $this->evaluarSiPuedeCursar($materia, $estadosPorId);
            $puedeAprobar = $this->evaluarSiPuedeAprobar($materia, $estadosPorId);

            $estadoFinal = $estadoGuardado;
            // Para materias 'libres', computamos si está disponible o bloqueada.
            if ($estadoGuardado === 'libre') {
                $estadoFinal = $puedeCursar ? 'disponible' : 'bloqueada';
            }

            return $this->buildMateriaPayload($materia, $estadoFinal, $puedeCursar, $puedeAprobar);
        });
    }

    /**
     * Retorna solo los IDs de las materias con estado 'cursando' o 'disponible'.
     * Usado por el controlador de Horarios para validar el payload entrante.
     *
     * @param  User  $user
     * @return Collection
     */
    public function getIdsMateriasPlanificables(User $user): Collection
    {
        return $this->getMateriasConEstadoReal($user)
            ->whereIn('estado', ['cursando', 'disponible'])
            ->pluck('id');
    }

    /**
     * Valida si un usuario tiene permitido transicionar una materia a un nuevo estado.
     * Retorna un array con los nombres de las materias que bloquean la transición,
     * o un array vacío si la transición es permitida.
     *
     * @param  User     $user
     * @param  \App\Models\Materia  $materia
     * @param  string   $nuevoEstado (libre, cursando, regular, aprobada)
     * @return array
     */
    public function puedeTransicionarA(User $user, $materia, string $nuevoEstado): array
    {
        $misEstados = MateriaUsuario::where('usuario_id', $user->id)
            ->pluck('estado_historico', 'materia_id');

        $todasLasMaterias = $materia->carrera->materias()->with('correlatividades')->get();
        $estadosPorId = $todasLasMaterias->mapWithKeys(function ($m) use ($misEstados) {
            return [$m->id => $misEstados->get($m->id, 'libre')];
        });

        // 1. Validación Hacia Atrás (Requisitos Propios de la materia)
        if (in_array($nuevoEstado, ['cursando', 'regular'])) {
            if (!$this->evaluarSiPuedeCursar($materia, $estadosPorId)) {
                return ['Requisitos propios incumplidos'];
            }
        } elseif ($nuevoEstado === 'aprobada') {
            if (!$this->evaluarSiPuedeAprobar($materia, $estadosPorId)) {
                return ['Requisitos propios incumplidos'];
            }
        }

        // 2. Validación Hacia Adelante (Bloqueo Preventivo de Regresión)
        // Clonamos el estado actual y aplicamos la transición simulada
        $estadosSimulados = clone $estadosPorId;
        $estadosSimulados->put($materia->id, $nuevoEstado);

        $conflictos = [];

        foreach ($todasLasMaterias as $m) {
            // Excluimos la materia que estamos intentando modificar
            if ($m->id === $materia->id) {
                continue;
            }

            $estadoActual = $estadosPorId->get($m->id, 'libre');
            
            // Si la materia no fue activada por el usuario, no nos preocupa
            if ($estadoActual === 'libre') {
                continue;
            }

            // 1. ¿Era válido con la BD actual?
            $eraValidoAntes = false;
            if (in_array($estadoActual, ['cursando', 'regular'])) {
                $eraValidoAntes = $this->evaluarSiPuedeCursar($m, $estadosPorId);
            } elseif ($estadoActual === 'aprobada') {
                $eraValidoAntes = $this->evaluarSiPuedeAprobar($m, $estadosPorId);
            }

            // 2. ¿Sigue siendo válido con el cambio simulado?
            $esValidoAhora = false;
            if (in_array($estadoActual, ['cursando', 'regular'])) {
                $esValidoAhora = $this->evaluarSiPuedeCursar($m, $estadosSimulados);
            } elseif ($estadoActual === 'aprobada') {
                $esValidoAhora = $this->evaluarSiPuedeAprobar($m, $estadosSimulados);
            }

            // 3. SOLO es un conflicto si esta acción acaba de romperlo
            if ($eraValidoAntes && !$esValidoAhora) {
                $conflictos[] = $m->nombre;
            }
        }

        return $conflictos;
    }

    /**
     * Evalúa si una materia puede ser cursada/regularizada.
     */
    private function evaluarSiPuedeCursar($materia, Collection $estadosPorId): bool
    {
        foreach ($materia->correlatividades as $correlativa) {
            $estadoRequisito = $estadosPorId->get($correlativa->requisito_id, 'libre');

            if ($correlativa->condicion_requerida === 'regular') {
                if (!in_array($estadoRequisito, ['regular', 'aprobada'])) {
                    return false;
                }
            } elseif ($correlativa->condicion_requerida === 'aprobada') {
                if ($materia->nombre === 'Trabajo Final Integrador') {
                    // Para cursar el TFI, los requisitos 'aprobada' se degradan a requerir al menos 'regular'.
                    if (!in_array($estadoRequisito, ['regular', 'aprobada'])) {
                        return false;
                    }
                } else {
                    if ($estadoRequisito !== 'aprobada') {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Evalúa si una materia puede ser aprobada (acreditada).
     */
    private function evaluarSiPuedeAprobar($materia, Collection $estadosPorId): bool
    {
        foreach ($materia->correlatividades as $correlativa) {
            $estadoRequisito = $estadosPorId->get($correlativa->requisito_id, 'libre');

            if ($correlativa->condicion_requerida === 'regular') {
                if (!in_array($estadoRequisito, ['regular', 'aprobada'])) {
                    return false;
                }
            } elseif ($correlativa->condicion_requerida === 'aprobada') {
                // Para aprobar (incluso el TFI), se exige estrictamente que esté aprobada.
                if ($estadoRequisito !== 'aprobada') {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Construye el array de datos de una materia para la respuesta JSON.
     */
    private function buildMateriaPayload($materia, string $estado, bool $puedeCursar, bool $puedeAprobar): array
    {
        return [
            'id'             => $materia->id,
            'nombre'         => $materia->nombre,
            'nivel'          => $materia->nivel,
            'estado'         => $estado,
            'puede_cursar'   => $puedeCursar,
            'puede_aprobar'  => $puedeAprobar,
            'prereq' => [
                'cursadas'  => $materia->correlatividades
                    ->where('condicion_requerida', 'regular')
                    ->pluck('requisito_id')
                    ->values(),
                'aprobadas' => $materia->correlatividades
                    ->where('condicion_requerida', 'aprobada')
                    ->pluck('requisito_id')
                    ->values(),
            ],
        ];
    }
}
