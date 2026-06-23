<?php

namespace App\Http\Controllers;

use App\Models\RecordatorioCuota;
use Illuminate\Http\Request;

class RecordatorioCuotaController extends Controller
{
    // Recordatorio personal de cuota del usuario autenticado (si todavía no
    // cargó ninguno, no existe fila y se devuelve monto null).
    public function show(Request $request)
    {
        $recordatorio = RecordatorioCuota::where('usuario_id', $request->user()->id)->first();

        return response()->json([
            'monto' => $recordatorio?->monto,
        ]);
    }

    // Actualiza únicamente el monto guardado (no crea un recordatorio nuevo
    // cada vez, siempre pisa el mismo registro del usuario).
    public function update(Request $request)
    {
        $data = $request->validate([
            'monto' => 'required|numeric|min:0',
        ]);

        $recordatorio = RecordatorioCuota::updateOrCreate(
            ['usuario_id' => $request->user()->id],
            ['monto' => $data['monto']]
        );

        return response()->json(['monto' => $recordatorio->monto]);
    }
}
