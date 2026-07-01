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

        // Horas totales esta semana (Lunes a Domingo)
        $horasSemana = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->startOfWeek())
            ->sum('duracion_segundos') / 3600;

        // Días únicos con sesión para rachas y heatmap
        $diasConSesion = SesionPomodoro::where('usuario_id', $usuarioId)
            ->selectRaw('DATE(completada_en) as dia')
            ->distinct()
            ->orderBy('dia', 'asc')
            ->pluck('dia')
            ->flip();

        // Racha actual
        $rachaActual = 0;
        $cursor = now()->startOfDay();
        if (!$diasConSesion->has($cursor->toDateString())) {
            $cursor->subDay();
        }
        while ($diasConSesion->has($cursor->toDateString())) {
            $rachaActual++;
            $cursor->subDay();
        }

        // Mejor racha histórica
        $allDaysSorted = SesionPomodoro::where('usuario_id', $usuarioId)
            ->selectRaw('DATE(completada_en) as dia')
            ->distinct()
            ->orderBy('dia', 'asc')
            ->pluck('dia')
            ->map(fn($d) => Carbon::parse($d));

        $bestRacha = 0;
        $currentRacha = 0;
        $prevDate = null;

        foreach ($allDaysSorted as $date) {
            if ($prevDate === null) {
                $currentRacha = 1;
            } else {
                $diff = $date->diffInDays($prevDate);
                if ($diff === 1) {
                    $currentRacha++;
                } elseif ($diff > 1) {
                    if ($currentRacha > $bestRacha) {
                        $bestRacha = $currentRacha;
                    }
                    $currentRacha = 1;
                }
            }
            $prevDate = $date;
        }
        if ($currentRacha > $bestRacha) {
            $bestRacha = $currentRacha;
        }

        // Actividad últimos 90 días (Heatmap)
        $actividad = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->subDays(90)->startOfDay())
            ->selectRaw('DATE(completada_en) as dia, COUNT(*) as cantidad')
            ->groupBy('dia')
            ->pluck('cantidad', 'dia');

        // Horas diarias últimos 7 días (Gráfico de barras)
        $startOfLast7Days = now()->subDays(6)->startOfDay();
        $sessionsLast7Days = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', $startOfLast7Days)
            ->selectRaw('DATE(completada_en) as dia, SUM(duracion_segundos) as segundos')
            ->groupBy('dia')
            ->pluck('segundos', 'dia');

        $horasDiarias = [];
        $daysMap = ['domingo' => 'Dom', 'lunes' => 'Lun', 'martes' => 'Mar', 'miércoles' => 'Mié', 'jueves' => 'Jue', 'viernes' => 'Vie', 'sábado' => 'Sáb'];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->toDateString();
            $dayName = $date->locale('es')->dayName;
            $dayLabel = isset($daysMap[strtolower($dayName)]) ? $daysMap[strtolower($dayName)] : substr($dayName, 0, 3);

            $seconds = $sessionsLast7Days->get($dateStr, 0);
            $horasDiarias[] = [
                'day' => ucfirst($dayLabel),
                'hours' => round($seconds / 3600, 2)
            ];
        }

        // Distribución por materia (Donut chart)
        $distribucionMaterias = SesionPomodoro::where('usuario_id', $usuarioId)
            ->whereNotNull('materia_id')
            ->with('materia')
            ->selectRaw('materia_id, SUM(duracion_segundos) as segundos')
            ->groupBy('materia_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->materia->nombre,
                    'hours' => round($item->segundos / 3600, 2),
                ];
            });

        return response()->json([
            'horas_semana' => round($horasSemana, 1),
            'racha_dias' => $rachaActual,
            'racha_maxima' => $bestRacha,
            'actividad' => $actividad,
            'horas_diarias' => $horasDiarias,
            'distribucion_materias' => $distribucionMaterias,
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
