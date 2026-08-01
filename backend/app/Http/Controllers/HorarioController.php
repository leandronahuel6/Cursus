<?php

namespace App\Http\Controllers;

use App\Models\HorarioUsuario;
use App\Services\AcademicStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para la gestión del simulador de horarios del usuario.
 *
 * Delega la validación de elegibilidad de materias al AcademicStatusService,
 * aplicando el principio SRP. Este controlador solo orquesta la persistencia
 * y la exposición de datos, sin lógica de dominio académico propia.
 */
class HorarioController extends Controller
{
    public function __construct(private readonly AcademicStatusService $academicService) {}

    /**
     * Devuelve la grilla horaria guardada del usuario autenticado.
     * Incluye el campo 'comision' para la correcta hidratación del estado
     * bidireccional en el frontend (selector del modal de edición).
     */
    public function index(Request $request): JsonResponse
    {
        $bloques = HorarioUsuario::where('usuario_id', $request->user()->id)
            ->with('materia')
            ->get()
            ->map(fn ($horario) => [
                'id'         => $horario->id,
                'tipo'       => $horario->tipo,
                'materia_id' => $horario->materia_id,
                'nombre'     => $horario->tipo === 'materia'
                    ? $horario->materia?->nombre
                    : $horario->titulo_actividad,
                'dia'        => $horario->dia_semana,
                'inicio'     => substr($horario->hora_inicio, 0, 5),
                'fin'        => substr($horario->hora_fin, 0, 5),
                'color'      => $horario->color,
                'version'    => $horario->version,
                'comision'   => $horario->comision,
            ]);

        return response()->json($bloques);
    }

    /**
     * Reemplaza toda la grilla horaria de una versión del usuario por la enviada.
     *
     * La validación de elegibilidad de materias es estricta: solo se aceptan
     * materias con estado 'cursando' o 'disponible' (computado al vuelo con
     * correlatividades por el AcademicStatusService). Esto evita que un usuario
     * pueda agendar materias bloqueadas, aprobadas o regulares mediante
     * manipulación del payload.
     */
    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'version'                     => 'required|string|in:A,B',
            'blocks'                      => 'array',
            'blocks.*.tipo'               => 'required|in:materia,actividad',
            'blocks.*.materia_id'         => 'required_if:blocks.*.tipo,materia|nullable|exists:materias,id',
            'blocks.*.titulo_actividad'   => 'required_if:blocks.*.tipo,actividad|nullable|string|max:255',
            'blocks.*.dia_semana'         => 'required|integer|min:1|max:6',
            'blocks.*.hora_inicio'        => 'required|date_format:H:i',
            'blocks.*.hora_fin'           => 'required|date_format:H:i|after:blocks.*.hora_inicio',
            'blocks.*.color'              => 'nullable|string|max:20',
            'blocks.*.comision'           => 'nullable|string|max:20',
        ]);

        $usuarioId = $request->user()->id;
        $version   = $data['version'];
        $blocks    = $data['blocks'] ?? [];

        // Computamos al vuelo el pool de materias que el alumno puede planificar.
        // Incluye tanto las que está cursando como las que tiene disponibles (correlativas OK).
        $materiasPlanificables = $this->academicService->getIdsMateriasPlanificables($request->user());

        foreach ($blocks as $block) {
            if ($block['tipo'] === 'materia' && !$materiasPlanificables->contains($block['materia_id'])) {
                abort(422, 'Solo se pueden planificar materias que estés cursando o tengas disponibles.');
            }
        }

        DB::transaction(function () use ($usuarioId, $blocks, $version) {
            // Eliminamos solo los bloques de la versión sincronizada, preservando la otra.
            HorarioUsuario::where('usuario_id', $usuarioId)
                ->where('version', $version)
                ->delete();

            foreach ($blocks as $block) {
                HorarioUsuario::create([
                    'usuario_id'       => $usuarioId,
                    'tipo'             => $block['tipo'],
                    'materia_id'       => $block['tipo'] === 'materia' ? $block['materia_id'] : null,
                    'titulo_actividad' => $block['tipo'] === 'actividad' ? $block['titulo_actividad'] : null,
                    'dia_semana'       => $block['dia_semana'],
                    'hora_inicio'      => $block['hora_inicio'],
                    'hora_fin'         => $block['hora_fin'],
                    'color'            => $block['color'] ?? null,
                    'version'          => $version,
                    'comision'         => $block['comision'] ?? null,
                ]);
            }
        });

        return response()->json(['message' => 'Horario guardado correctamente']);
    }

    /**
     * Devuelve el horario de otro usuario por su ID para la función de comparación.
     * Incluye 'comision' para que la vista de comparación pueda mostrarlo correctamente.
     */
    public function sharedSchedule(Request $request, int $userId): JsonResponse
    {
        $usuario = \App\Models\User::find($userId);

        if (!$usuario) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $bloques = HorarioUsuario::where('usuario_id', $userId)
            ->with('materia')
            ->get()
            ->map(fn ($horario) => [
                'id'         => $horario->id,
                'tipo'       => $horario->tipo,
                'materia_id' => $horario->materia_id,
                'nombre'     => $horario->tipo === 'materia'
                    ? $horario->materia?->nombre
                    : $horario->titulo_actividad,
                'dia'        => $horario->dia_semana,
                'inicio'     => substr($horario->hora_inicio, 0, 5),
                'fin'        => substr($horario->hora_fin, 0, 5),
                'color'      => $horario->color,
                'version'    => $horario->version,
                'comision'   => $horario->comision,
            ]);

        return response()->json([
            'nombre_usuario' => $usuario->nombre,
            'bloques'        => $bloques,
        ]);
    }

    /**
     * Busca un usuario por email o legajo para la función de comparación de horarios.
     */
    public function findUser(Request $request): JsonResponse
    {
        $query = $request->input('search');

        if (empty($query)) {
            return response()->json([]);
        }

        $users = \App\Models\User::where('email', $query)
            ->orWhere('legajo', $query)
            ->get(['id', 'nombre', 'email', 'legajo']);

        return response()->json($users);
    }
}
