<?php

namespace App\Http\Controllers;

use App\Models\Cuota;
use Illuminate\Http\Request;

class CuotaController extends Controller
{
    // Ver la cuota vigente de una carrera
    public function index(Request $request)
    {
        $request->validate([
            'carrera_id' => 'required|exists:carreras,id',
        ]);

        $cuota = Cuota::where('carrera_id', $request->carrera_id)
            ->orderBy('vigente_desde', 'desc')
            ->first();

        if (!$cuota) {
            return response()->json(['message' => 'No hay cuota cargada para esta carrera'], 404);
        }

        return response()->json($cuota);
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