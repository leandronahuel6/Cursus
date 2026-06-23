<?php

namespace App\Http\Controllers;

use App\Models\MateriaUsuario;
use App\Models\Tarea;
use Illuminate\Http\Request;

class TareaController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['materia_id' => 'required|exists:materias,id']);

        $tareas = Tarea::where('usuario_id', $request->user()->id)
            ->where('materia_id', $request->materia_id)
            ->orderBy('created_at')
            ->get();

        return response()->json($tareas);
    }

    // Tareas con fecha de vencimiento de todas las materias que el usuario está
    // cursando, sin importar cuál tenga seleccionada en el Área de Estudio.
    // Alimenta la tarjeta "Entregas próximas" del Inicio.
    public function proximas(Request $request)
    {
        $usuarioId = $request->user()->id;

        $materiasCursandoIds = MateriaUsuario::where('usuario_id', $usuarioId)
            ->where('estado_historico', 'cursando')
            ->pluck('materia_id');

        $tareas = Tarea::where('usuario_id', $usuarioId)
            ->whereIn('materia_id', $materiasCursandoIds)
            ->whereNotNull('fecha_vencimiento')
            ->where('columna', '!=', 'finalizado')
            ->with('materia')
            ->orderBy('fecha_vencimiento')
            ->limit(8)
            ->get()
            ->map(fn ($tarea) => [
                'id' => $tarea->id,
                'titulo' => $tarea->titulo,
                'materia_nombre' => $tarea->materia->nombre,
                'fecha_vencimiento' => $tarea->fecha_vencimiento->toDateString(),
            ]);

        return response()->json($tareas);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'materia_id' => 'required|exists:materias,id',
            'titulo' => 'required|string|max:255',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $tarea = Tarea::create([
            'usuario_id' => $request->user()->id,
            'materia_id' => $data['materia_id'],
            'titulo' => $data['titulo'],
            'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
            'columna' => 'pendiente',
        ]);

        return response()->json($tarea, 201);
    }

    public function update(Request $request, Tarea $tarea)
    {
        abort_unless($tarea->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'columna' => 'sometimes|in:pendiente,progreso,finalizado',
            'titulo' => 'sometimes|string|max:255',
            'fecha_vencimiento' => 'sometimes|nullable|date',
        ]);

        $tarea->update($data);

        return response()->json($tarea);
    }

    public function destroy(Request $request, Tarea $tarea)
    {
        abort_unless($tarea->usuario_id === $request->user()->id, 403);

        $tarea->delete();

        return response()->json(['message' => 'Tarea eliminada correctamente']);
    }
}
