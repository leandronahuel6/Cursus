<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
use App\Models\MateriaUsuario;
use App\Models\Nota;
use Illuminate\Http\Request;

class MateriaController extends Controller
{
    public function index(Request $request)
    {
        $carrera = Carrera::where('nombre', $request->query('carrera', 'Tecnicatura Universitaria en Programación'))
            ->firstOrFail();

        $materias = $carrera->materias()
            ->with('correlatividades')
            ->orderBy('id')
            ->get()
            ->map(function ($materia) {
                return [
                    'id' => $materia->id,
                    'nombre' => $materia->nombre,
                    'nivel' => $materia->nivel,
                    'prereq' => [
                        'cursadas' => $materia->correlatividades
                            ->where('condicion_requerida', 'regular')
                            ->pluck('requisito_id')
                            ->values(),
                        'aprobadas' => $materia->correlatividades
                            ->where('condicion_requerida', 'aprobada')
                            ->pluck('requisito_id')
                            ->values(),
                    ],
                ];
            });

        return response()->json($materias);
    }

    // Igual que index(), pero le suma a cada materia el estado real de cursada
    // del usuario autenticado (y su nota final, si la tiene aprobada).
    public function misMaterias(Request $request)
    {
        $carrera = Carrera::where('nombre', $request->query('carrera', 'Tecnicatura Universitaria en Programación'))
            ->firstOrFail();

        $materiasIds = $carrera->materias()->pluck('id');

        $misEstados = MateriaUsuario::where('usuario_id', $request->user()->id)
            ->whereIn('materia_id', $materiasIds)
            ->with(['notas' => function ($query) {
                $query->where('tipo', 'final')->latest('fecha');
            }])
            ->get()
            ->keyBy('materia_id');

        $materias = $carrera->materias()
            ->with('correlatividades')
            ->orderBy('id')
            ->get()
            ->map(function ($materia) use ($misEstados) {
                $materiaUsuario = $misEstados->get($materia->id);

                return [
                    'id' => $materia->id,
                    'nombre' => $materia->nombre,
                    'nivel' => $materia->nivel,
                    'prereq' => [
                        'cursadas' => $materia->correlatividades
                            ->where('condicion_requerida', 'regular')
                            ->pluck('requisito_id')
                            ->values(),
                        'aprobadas' => $materia->correlatividades
                            ->where('condicion_requerida', 'aprobada')
                            ->pluck('requisito_id')
                            ->values(),
                    ],
                    'estado' => $materiaUsuario->estado_historico ?? 'libre',
                    'nota' => optional($materiaUsuario?->notas->first())->valor,
                ];
            });

        return response()->json($materias);
    }

    // Actualiza el estado de cursada del usuario autenticado para una materia
    // (libre/cursando/regular/aprobada), registrando la nota final si corresponde.
    public function actualizarEstado(Request $request, \App\Models\Materia $materia)
    {
        $data = $request->validate([
            'estado' => 'required|in:libre,cursando,regular,aprobada',
            'nota' => 'nullable|numeric|min:0|max:10',
        ]);

        $materiaUsuario = MateriaUsuario::updateOrCreate(
            ['usuario_id' => $request->user()->id, 'materia_id' => $materia->id],
            ['estado_historico' => $data['estado']]
        );

        if ($data['estado'] === 'aprobada' && array_key_exists('nota', $data) && $data['nota'] !== null) {
            Nota::create([
                'materia_usuario_id' => $materiaUsuario->id,
                'tipo' => 'final',
                'numero' => 1,
                'valor' => $data['nota'],
                'fecha' => now()->toDateString(),
            ]);
        }

        return response()->json(['estado' => $materiaUsuario->estado_historico]);
    }
}
