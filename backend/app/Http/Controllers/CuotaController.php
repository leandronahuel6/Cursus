<?php

namespace App\Http\Controllers;

use App\Models\Cuota;
use Illuminate\Http\Request;

class CuotaController extends Controller
{
    // Ver la cuota vigente. Si se pasa carrera_id filtra por carrera; si no, devuelve la más reciente.
    public function index(Request $request)
    {
        $query = Cuota::where('vigente_desde', '<=', now()->toDateString())
                      ->orderBy('vigente_desde', 'desc');

        if ($request->filled('carrera_id')) {
            $request->validate(['carrera_id' => 'exists:carreras,id']);
            $query->where('carrera_id', $request->carrera_id);
        }

        $cuota = $query->first();

        if (!$cuota) {
            return response()->json(['message' => 'No hay cuota cargada'], 404);
        }

        $proximaQuery = Cuota::where('vigente_desde', '>', now()->toDateString())
                             ->orderBy('vigente_desde', 'asc');
        if ($request->filled('carrera_id')) {
            $proximaQuery->where('carrera_id', $request->carrera_id);
        }

        return response()->json(array_merge($cuota->toArray(), [
            'cuota_proxima' => $proximaQuery->first(),
        ]));
    }

    // Cargar una cuota nueva (uso de admin)
    public function store(Request $request)
    {
        $request->validate([
            'carrera_id' => 'required|exists:carreras,id',
            'valor_mensual' => 'required|numeric|min:0',
            'vigente_desde' => 'required|date',
        ]);

        $cuota = Cuota::create($request->all());

        return response()->json($cuota, 201);
    }
}