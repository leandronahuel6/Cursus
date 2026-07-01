<?php

namespace App\Http\Controllers;

use App\Models\Materia;
use App\Models\MateriaUsuario;
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

    // Resumen completo para la pestaña "Productividad y Estudio" de Mi Progreso:
    // rachas, horas por día, actividad para el heatmap, distribución por materia,
    // hora más productiva y materias en curso para el tip de rendimiento.
    public function productividad(Request $request)
    {
        $usuarioId = $request->user()->id;

        $diasConSesion = SesionPomodoro::where('usuario_id', $usuarioId)
            ->selectRaw('DATE(completada_en) as dia')
            ->distinct()
            ->pluck('dia')
            ->flip();

        $rachaActual = 0;
        $cursor = now()->startOfDay();
        if (!$diasConSesion->has($cursor->toDateString())) {
            $cursor->subDay();
        }
        while ($diasConSesion->has($cursor->toDateString())) {
            $rachaActual++;
            $cursor->subDay();
        }

        $mejorRacha = 0;
        $rachaTmp = 0;
        $anterior = null;
        foreach ($diasConSesion->keys()->sort()->values() as $dia) {
            $fecha = Carbon::parse($dia);
            $rachaTmp = ($anterior !== null && $anterior->diffInDays($fecha) === 1) ? $rachaTmp + 1 : 1;
            $mejorRacha = max($mejorRacha, $rachaTmp);
            $anterior = $fecha;
        }
        $mejorRacha = max($mejorRacha, $rachaActual);

        $segundosPorDia = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(completada_en) as dia, SUM(duracion_segundos) as segundos')
            ->groupBy('dia')
            ->pluck('segundos', 'dia');

        $nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        $horasPorDia = [];
        for ($i = 6; $i >= 0; $i--) {
            $fecha = now()->subDays($i);
            $segundos = $segundosPorDia[$fecha->toDateString()] ?? 0;
            $horasPorDia[] = [
                'dia' => $nombresDias[$fecha->dayOfWeekIso - 1],
                'fecha' => $fecha->toDateString(),
                'horas' => round($segundos / 3600, 2),
            ];
        }

        $actividad = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->subDays(44)->startOfDay())
            ->selectRaw('DATE(completada_en) as dia, COUNT(*) as cantidad')
            ->groupBy('dia')
            ->pluck('cantidad', 'dia');

        $distribucion = SesionPomodoro::where('usuario_id', $usuarioId)
            ->whereNotNull('materia_id')
            ->where('completada_en', '>=', now()->subDays(30)->startOfDay())
            ->selectRaw('materia_id, SUM(duracion_segundos) as segundos')
            ->groupBy('materia_id')
            ->orderByDesc('segundos')
            ->with('materia:id,nombre')
            ->get()
            ->map(fn ($fila) => [
                'materia' => $fila->materia->nombre ?? 'Sin materia',
                'horas' => round($fila->segundos / 3600, 2),
            ])
            ->values();

        $segundosPorHora = SesionPomodoro::where('usuario_id', $usuarioId)
            ->where('completada_en', '>=', now()->subDays(30)->startOfDay())
            ->selectRaw('HOUR(completada_en) as hora, SUM(duracion_segundos) as segundos')
            ->groupBy('hora')
            ->pluck('segundos', 'hora');

        $horaPico = null;
        if ($segundosPorHora->isNotEmpty()) {
            $mejorBloque = null;
            $mejorTotal = 0;
            for ($h = 0; $h < 24; $h += 2) {
                $total = ($segundosPorHora[$h] ?? 0) + ($segundosPorHora[$h + 1] ?? 0);
                if ($total > $mejorTotal) {
                    $mejorTotal = $total;
                    $mejorBloque = $h;
                }
            }
            if ($mejorBloque !== null) {
                $horaPico = sprintf('%02d:00 a %02d:00', $mejorBloque, $mejorBloque + 2);
            }
        }

        $promedioDiario = round(collect($horasPorDia)->sum('horas') / 7, 1);

        $materiasCursando = MateriaUsuario::where('usuario_id', $usuarioId)
            ->where('estado_historico', 'cursando')
            ->with('materia:id,nombre')
            ->get()
            ->pluck('materia.nombre')
            ->filter()
            ->values();

        return response()->json([
            'racha_actual' => $rachaActual,
            'racha_mejor' => $mejorRacha,
            'horas_por_dia' => $horasPorDia,
            'actividad' => $actividad,
            'distribucion_materias' => $distribucion,
            'hora_pico' => $horaPico,
            'promedio_diario' => $promedioDiario,
            'materias_cursando' => $materiasCursando,
        ]);
    }
}
