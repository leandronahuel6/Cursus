<?php

namespace App\Http\Controllers;

use App\Models\Materia;
use App\Models\SesionPomodoro;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SesionPomodoroController extends Controller
{
    // Registra una sesión de Pomodoro completada por el usuario autenticado.
    public function store(Request $request)
    {
        $data = $request->validate([
            'materia_id' => 'nullable|exists:materias,id',
            'duracion_segundos' => 'required|integer|min:1',
        ]);

        $sesion = SesionPomodoro::create([
            'usuario_id' => $request->user()->id,
            'materia_id' => $data['materia_id'] ?? null,
            'duracion_segundos' => $data['duracion_segundos'],
            'completada_en' => now(),
        ]);

        return response()->json($sesion, 201);
    }

    // Resumen global (sin importar la materia) para el Inicio: horas de la
    // semana, racha de días consecutivos y actividad de los últimos 91 días.
    public function resumenUsuario(Request $request)
    {
        $usuarioId = $request->user()->id;

        $horasSemana = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->startOfWeek())
            ->sum('duracion_segundos') / 3600;

        $diasConSesion = SesionPomodoro::where('usuario_id', $usuarioId)
            ->selectRaw('DATE(completada_en) as dia')
            ->distinct()
            ->pluck('dia')
            ->flip();

        $racha = 0;
        $cursor = now()->startOfDay();
        if (!$diasConSesion->has($cursor->toDateString())) {
            $cursor->subDay();
        }
        while ($diasConSesion->has($cursor->toDateString())) {
            $racha++;
            $cursor->subDay();
        }

        $actividad = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->subDays(90)->startOfDay())
            ->selectRaw('DATE(completada_en) as dia, COUNT(*) as cantidad')
            ->groupBy('dia')
            ->pluck('cantidad', 'dia');

        return response()->json([
            'horas_semana' => round($horasSemana, 1),
            'racha_dias' => $racha,
            'actividad' => $actividad,
        ]);
    }

    // Resumen por materia para los chips/log del Área de Estudio.
    public function resumenMateria(Request $request, Materia $materia)
    {
        $usuarioId = $request->user()->id;

        $horasSemana = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('materia_id', $materia->id)
            ->where('completada_en', '>=', now()->startOfWeek())
            ->sum('duracion_segundos') / 3600;

        $sesionesTotales = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('materia_id', $materia->id)
            ->count();

        $sesionesHoy = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('materia_id', $materia->id)
            ->whereDate('completada_en', Carbon::today())
            ->orderBy('completada_en')
            ->get()
            ->map(fn ($sesion) => [
                'hora' => $sesion->completada_en->format('H:i'),
                'duracion_segundos' => $sesion->duracion_segundos,
            ]);

        return response()->json([
            'horas_semana' => round($horasSemana, 1),
            'sesiones_totales' => $sesionesTotales,
            'sesiones_hoy' => $sesionesHoy,
        ]);
    }
}
