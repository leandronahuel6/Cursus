<?php

namespace App\Http\Controllers;

use App\Models\Marcador;
use Illuminate\Http\Request;

class MarcadorController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['materia_id' => 'required|exists:materias,id']);

        $marcadores = Marcador::where('usuario_id', $request->user()->id)
            ->where('materia_id', $request->materia_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($marcadores);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'materia_id' => 'required|exists:materias,id',
            'url' => 'required|url|max:2048',
            'titulo' => 'nullable|string|max:255',
        ]);

        $marcador = Marcador::create([
            'usuario_id' => $request->user()->id,
            'materia_id' => $data['materia_id'],
            'url' => $data['url'],
            'titulo' => $data['titulo'] ?? null,
        ]);

        return response()->json($marcador, 201);
    }

    public function update(Request $request, Marcador $marcador)
    {
        abort_unless($marcador->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'url' => 'required|url|max:2048',
            'titulo' => 'nullable|string|max:255',
        ]);

        $marcador->update([
            'url' => $data['url'],
            'titulo' => $data['titulo'] ?? null,
        ]);

        return response()->json($marcador);
    }

    public function destroy(Request $request, Marcador $marcador)
    {
        abort_unless($marcador->usuario_id === $request->user()->id, 403);

        $marcador->delete();

        return response()->json(['message' => 'Marcador eliminado correctamente']);
    }
}
