<?php

namespace App\Http\Controllers;

use App\Models\Alerta;
use Illuminate\Http\Request;

class AlertaController extends Controller
{
    public function index(Request $request)
    {
        $alertas = Alerta::where('usuario_id', $request->user()->id)
            ->orderBy('fecha')
            ->get();

        return response()->json($alertas);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'categoria' => 'required|in:academic,administrative,personal',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'fecha' => 'required|date',
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'prioridad' => 'required|in:baja,media,alta',
        ]);

        if (isset($data['color'])) {
            $data['color'] = strtolower($data['color']);
        }

        $alerta = Alerta::create([
            ...$data,
            'usuario_id' => $request->user()->id,
        ]);

        return response()->json($alerta, 201);
    }

    public function update(Request $request, Alerta $alerta)
    {
        abort_unless($alerta->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'completada' => 'sometimes|boolean',
            'titulo' => 'sometimes|string|max:255',
            'descripcion' => 'sometimes|nullable|string|max:255',
            'fecha' => 'sometimes|date',
            'color' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'prioridad' => 'sometimes|in:baja,media,alta',
        ]);

        if (array_key_exists('color', $data) && $data['color'] !== null) {
            $data['color'] = strtolower($data['color']);
        }

        $alerta->update($data);

        return response()->json($alerta);
    }

    public function destroy(Request $request, Alerta $alerta)
    {
        abort_unless($alerta->usuario_id === $request->user()->id, 403);

        $alerta->delete();

        return response()->json(['message' => 'Alerta eliminada correctamente']);
    }
}
