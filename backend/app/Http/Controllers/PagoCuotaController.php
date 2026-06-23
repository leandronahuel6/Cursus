<?php

namespace App\Http\Controllers;

use App\Models\PagoCuota;
use Illuminate\Http\Request;

class PagoCuotaController extends Controller
{
    // Estado de la cuota del mes actual: si ya está pagada, y cuántos días
    // quedan para el día 15 (límite antes de que se aplican recargos).
    // Al empezar un mes nuevo no hay fila para ese período todavía, así que
    // "pagado" vuelve a false automáticamente sin necesidad de ningún cron.
    public function estado(Request $request)
    {
        $periodo = now()->format('Y-m');

        $pago = PagoCuota::where('usuario_id', $request->user()->id)
            ->where('periodo', $periodo)
            ->first();

        return response()->json([
            'periodo' => $periodo,
            'pagado' => $pago !== null,
            'fecha_pago' => $pago?->fecha_pago->toDateString(),
            'dias_para_vencimiento' => 15 - now()->day,
        ]);
    }

    // Registra el pago de la cuota del mes actual. Si ya existía un pago
    // para este período, lo corrige en vez de duplicarlo.
    public function store(Request $request)
    {
        $data = $request->validate([
            'fecha_pago' => 'required|date',
        ]);

        $periodo = now()->format('Y-m');

        PagoCuota::updateOrCreate(
            ['usuario_id' => $request->user()->id, 'periodo' => $periodo],
            ['fecha_pago' => $data['fecha_pago']]
        );

        return response()->json([
            'periodo' => $periodo,
            'pagado' => true,
            'fecha_pago' => $data['fecha_pago'],
            'dias_para_vencimiento' => 15 - now()->day,
        ]);
    }
}
