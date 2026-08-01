<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\MateriaUsuario;
use App\Models\Nota;
use App\Services\AcademicStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controlador para la gestión del plan de estudios del usuario.
 * Expone el catálogo de materias de la carrera y permite actualizar
 * el estado de cursado de cada una.
 */
class MateriaController extends Controller
{
    public function __construct(private readonly AcademicStatusService $academicService) {}

    /**
     * Retorna todas las materias de una carrera con sus datos de correlatividades.
     * Endpoint público sin estado de usuario.
     */
    public function index(Request $request): JsonResponse
    {
        $carrera = Carrera::where('nombre', $request->query('carrera', 'Tecnicatura Universitaria en Programación'))
            ->firstOrFail();

        $materias = $carrera->materias()
            ->with('correlatividades')
            ->orderBy('id')
            ->get()
            ->map(fn ($materia) => [
                'id'     => $materia->id,
                'nombre' => $materia->nombre,
                'nivel'  => $materia->nivel,
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
            ]);

        return response()->json($materias);
    }

    /**
     * Retorna las materias de la carrera enriquecidas con el estado académico
     * real del usuario autenticado, computado al vuelo via AcademicStatusService.
     *
     * El estado 'disponible' es calculado dinámicamente: una materia 'libre'
     * pasa a 'disponible' si el alumno cumple todas sus correlatividades.
     * Esto permite que el simulador de horarios ofrezca un catálogo completo
     * (Cursando + Disponibles) sin comprometer la integridad del dominio.
     */
    public function misMaterias(Request $request): JsonResponse
    {
        // Delegamos el cálculo complejo al servicio centralizado.
        // Esto garantiza que la lógica de correlatividades vive en un único lugar (DRY).
        $materias = $this->academicService->getMateriasConEstadoReal($request->user());

        // Enriquecemos con la nota final si está disponible, dato que solo necesita este endpoint.
        $misNotas = MateriaUsuario::where('usuario_id', $request->user()->id)
            ->with(['notas' => fn ($q) => $q->where('tipo', 'final')->latest('id')])
            ->get()
            ->keyBy('materia_id');

        $materiasConNota = $materias->map(function ($materia) use ($misNotas) {
            $materiaUsuario = $misNotas->get($materia['id']);
            return array_merge($materia, [
                'nota' => optional($materiaUsuario?->notas->first())->valor,
            ]);
        });

        return response()->json($materiasConNota);
    }

    /**
     * Actualiza el estado de cursado del usuario autenticado para una materia específica
     * (libre/cursando/regular/aprobada), registrando la nota final si corresponde.
     */
    public function actualizarEstado(Request $request, \App\Models\Materia $materia): JsonResponse
    {
        $data = $request->validate([
            'estado' => 'required|in:libre,cursando,regular,aprobada',
            'nota'   => 'nullable|numeric|min:6|max:10',
        ]);

        $conflictos = $this->academicService->puedeTransicionarA($request->user(), $materia, $data['estado']);
        if (!empty($conflictos)) {
            return response()->json([
                'message' => 'No puedes cambiar el estado de esta materia porque invalidaría tu progreso en materias dependientes.',
                'conflictos' => $conflictos
            ], 422);
        }

        $materiaUsuario = MateriaUsuario::updateOrCreate(
            ['usuario_id' => $request->user()->id, 'materia_id' => $materia->id],
            ['estado_historico' => $data['estado']]
        );

        if ($data['estado'] === 'aprobada' && array_key_exists('nota', $data) && $data['nota'] !== null) {
            // 1. Purgar TODAS las notas finales previas para sanear la DB de duplicados
            Nota::where('materia_usuario_id', $materiaUsuario->id)->where('tipo', 'final')->delete();
            
            // 2. Crear la única nota definitiva (tendrá el ID más alto, perfecto para latest('id'))
            Nota::create([
                'materia_usuario_id' => $materiaUsuario->id,
                'tipo'               => 'final',
                'numero'             => 1,
                'valor'              => $data['nota'],
                'fecha'              => now()->toDateString(),
            ]);
        } else {
            // Si la bajamos a regular/cursando, borramos su nota de final.
            Nota::where('materia_usuario_id', $materiaUsuario->id)->where('tipo', 'final')->delete();
        }

        // Al actualizar un estado, el servidor recalcula todo el árbol de correlatividades
        // y devuelve el panorama completo. El frontend solo tiene que pintar lo que el servidor dicta.
        return $this->misMaterias($request);
    }
}
