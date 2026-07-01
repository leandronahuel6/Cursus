<?php

namespace App\Http\Controllers;

use App\Models\HorarioUsuario;
use App\Models\MateriaUsuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HorarioController extends Controller
{
    // Devuelve la grilla horaria guardada del usuario autenticado.
    public function index(Request $request)
    {
        $bloques = HorarioUsuario::where('usuario_id', $request->user()->id)
            ->with('materia')
            ->get()
            ->map(function ($horario) {
                return [
                    'id' => $horario->id,
                    'tipo' => $horario->tipo,
                    'materia_id' => $horario->materia_id,
                    'nombre' => $horario->tipo === 'materia'
                        ? $horario->materia?->nombre
                        : $horario->titulo_actividad,
                    'dia' => $horario->dia_semana,
                    'inicio' => substr($horario->hora_inicio, 0, 5),
                    'fin' => substr($horario->hora_fin, 0, 5),
                    'color' => $horario->color,
                    'version' => $horario->version,
                ];
            });

        return response()->json($bloques);
    }

    // Reemplaza toda la grilla horaria del usuario autenticado por la enviada.
    // Solo se permiten bloques de materias que el usuario esté cursando.
    public function sync(Request $request)
    {
        $data = $request->validate([
            'version' => 'required|string|in:A,B',
            'blocks' => 'array',
            'blocks.*.tipo' => 'required|in:materia,actividad',
            'blocks.*.materia_id' => 'required_if:blocks.*.tipo,materia|nullable|exists:materias,id',
            'blocks.*.titulo_actividad' => 'required_if:blocks.*.tipo,actividad|nullable|string|max:255',
            'blocks.*.dia_semana' => 'required|integer|min:1|max:6',
            'blocks.*.hora_inicio' => 'required|date_format:H:i',
            'blocks.*.hora_fin' => 'required|date_format:H:i|after:blocks.*.hora_inicio',
            'blocks.*.color' => 'nullable|string|max:10',
        ]);

        $usuarioId = $request->user()->id;
        $version = $data['version'] ?? 'A';
        $blocks = $data['blocks'] ?? [];

        $materiasCursando = MateriaUsuario::where('usuario_id', $usuarioId)
            ->where('estado_historico', 'cursando')
            ->pluck('materia_id');

        foreach ($blocks as $block) {
            if ($block['tipo'] === 'materia' && !$materiasCursando->contains($block['materia_id'])) {
                abort(422, 'Solo se pueden agendar materias que estés cursando.');
            }
        }

        DB::transaction(function () use ($usuarioId, $blocks, $version) {
            HorarioUsuario::where('usuario_id', $usuarioId)
                ->where('version', $version)
                ->delete();

            foreach ($blocks as $block) {
                HorarioUsuario::create([
                    'usuario_id' => $usuarioId,
                    'tipo' => $block['tipo'],
                    'materia_id' => $block['tipo'] === 'materia' ? $block['materia_id'] : null,
                    'titulo_actividad' => $block['tipo'] === 'actividad' ? $block['titulo_actividad'] : null,
                    'dia_semana' => $block['dia_semana'],
                    'hora_inicio' => $block['hora_inicio'],
                    'hora_fin' => $block['hora_fin'],
                    'color' => $block['color'] ?? null,
                    'version' => $version,
                ]);
            }
        });

        return response()->json(['message' => 'Horario guardado correctamente']);
    }

    // Devuelve el horario de otro usuario por su ID.
    public function sharedSchedule(Request $request, $userId)
    {
        $usuario = \App\Models\User::find($userId);
        if (!$usuario) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $bloques = HorarioUsuario::where('usuario_id', $userId)
            ->with('materia')
            ->get()
            ->map(function ($horario) {
                return [
                     'id' => $horario->id,
                     'tipo' => $horario->tipo,
                     'materia_id' => $horario->materia_id,
                     'nombre' => $horario->tipo === 'materia'
                         ? $horario->materia?->nombre
                         : $horario->titulo_actividad,
                     'dia' => $horario->dia_semana,
                     'inicio' => substr($horario->hora_inicio, 0, 5),
                     'fin' => substr($horario->hora_fin, 0, 5),
                     'color' => $horario->color,
                     'version' => $horario->version,
                 ];
             });
 
         return response()->json([
             'nombre_usuario' => $usuario->nombre,
             'bloques' => $bloques
         ]);
     }
 
     // Busca un usuario por email o legajo para comparar horarios.
     public function findUser(Request $request)
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
