<?php

namespace App\Http\Controllers;

use App\Models\Nota;
use App\Models\MateriaUsuario;
use Illuminate\Http\Request;

class NotaController extends Controller
{
    // Listar notas de una cursada específica
    public function index(Request $request)
    {
        $request->validate([
            'materia_usuario_id' => 'required|exists:materia_usuario,id',
        ]);

        $notas = Nota::where('materia_usuario_id', $request->materia_usuario_id)
            ->orderBy('fecha')
            ->get();

        return response()->json($notas);
    }

    // Cargar una nota nueva
    public function store(Request $request)
    {
        $request->validate([
            'materia_usuario_id' => 'required|exists:materia_usuario,id',
            'tipo' => 'required|in:parcial,recuperatorio,tp,final',
            'numero' => 'required|integer|min:1',
            'valor' => 'required|numeric|min:0|max:10',
            'fecha' => 'required|date',
        ]);

        $nota = Nota::create($request->all());

        return response()->json($nota, 201);
    }

    // Editar una nota existente
    public function update(Request $request, Nota $nota)
    {
        $request->validate([
            'valor' => 'sometimes|numeric|min:0|max:10',
            'fecha' => 'sometimes|date',
        ]);

        $nota->update($request->all());

        return response()->json($nota);
    }

    // Borrar una nota
    public function destroy(Nota $nota)
    {
        $nota->delete();

        return response()->json(['message' => 'Nota eliminada correctamente']);
    }
}