<?php

namespace App\Http\Controllers;

use App\Models\ConfigPomodoro;
use Illuminate\Http\Request;

class ConfigPomodoroController extends Controller
{
    /**
     * Devuelve la configuración de pomodoro del usuario autenticado.
     * Si no existe, la crea con los valores predeterminados.
     */
    public function show(Request $request)
    {
        $config = ConfigPomodoro::firstOrCreate(
            ['usuario_id' => $request->user()->id],
            [
                'tiempo_enfoque' => 25,
                'descanso_corto' => 5,
                'descanso_largo' => 20,
                'sesiones_por_ciclo' => 4,
                'ciclos_totales' => null,
                'sonido_alarma' => 'chime',
                'modo_estricto' => false,
                'reproducir_alarma' => true,
                'mostrar_widget' => true,
                'auto_reproduccion_fases' => true,
            ]
        );

        return response()->json($config);
    }

    /**
     * Actualiza la configuración de pomodoro del usuario.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'tiempo_enfoque' => 'integer|min:1|max:90',
            'descanso_corto' => 'integer|min:1|max:30',
            'descanso_largo' => 'integer|min:5|max:60',
            'sesiones_por_ciclo' => 'integer|min:1|max:8',
            'ciclos_totales' => 'nullable|integer|min:1|max:10',
            'sonido_alarma' => 'in:chime,beep,zen,none',
            'modo_estricto' => 'boolean',
            'reproducir_alarma' => 'boolean',
            'mostrar_widget' => 'boolean',
            'auto_reproduccion_fases' => 'boolean',
        ]);

        $config = ConfigPomodoro::updateOrCreate(
            ['usuario_id' => $request->user()->id],
            $data
        );

        return response()->json($config);
    }
}
