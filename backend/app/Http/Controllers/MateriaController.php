<?php

namespace App\Http\Controllers;

use App\Models\Carrera;
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
}
