<?php

namespace App\Http\Controllers;

use App\Models\MateriaUsuario;
use App\Models\Tarea;
use App\Models\TareaSubtarea;
use Illuminate\Http\Request;

class TareaController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['materia_id' => 'required|exists:materias,id']);

        $tareas = Tarea::where('usuario_id', $request->user()->id)
            ->where('materia_id', $request->materia_id)
            ->with('subtareas')
            ->orderBy('columna')
            ->orderBy('orden')
            ->get();

        return response()->json($tareas);
    }

    // Total de tareas pendientes del usuario en TODAS sus materias (sin filtrar
    // por una materia particular). Alimenta el stat "Tareas pendientes" del Inicio.
    public function pendientesCount(Request $request)
    {
        $cantidad = Tarea::where('usuario_id', $request->user()->id)
            ->where('columna', '!=', 'finalizado')
            ->count();

        return response()->json(['cantidad' => $cantidad]);
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
            'columna' => 'sometimes|in:pendiente,progreso,finalizado',
        ]);

        $columna = $data['columna'] ?? 'pendiente';
        $maxOrden = Tarea::where('usuario_id', $request->user()->id)
            ->where('materia_id', $data['materia_id'])
            ->where('columna', $columna)
            ->max('orden') ?? 0;

        $tarea = Tarea::create([
            'usuario_id' => $request->user()->id,
            'materia_id' => $data['materia_id'],
            'titulo' => $data['titulo'],
            'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
            'columna' => $columna,
            'orden' => $maxOrden + 1000,
        ]);

        $tarea->load('subtareas');
        return response()->json($tarea, 201);
    }

    public function update(Request $request, Tarea $tarea)
    {
        abort_unless($tarea->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'columna' => 'sometimes|in:pendiente,progreso,finalizado',
            'titulo' => 'sometimes|string|max:255',
            'descripcion' => 'sometimes|nullable|string',
            'fecha_vencimiento' => 'sometimes|nullable|date',
        ]);

        $tarea->update($data);

        return response()->json($tarea->load('subtareas'));
    }

    public function destroy(Request $request, Tarea $tarea)
    {
        abort_unless($tarea->usuario_id === $request->user()->id, 403);

        $tarea->delete();

        return response()->json(['message' => 'Tarea eliminada correctamente']);
    }

    public function mover(Request $request)
    {
        $data = $request->validate([
            'tareas' => 'required|array',
            'tareas.*.id' => 'required|exists:tareas,id',
            'tareas.*.columna' => 'required|in:pendiente,progreso,finalizado',
            'tareas.*.orden' => 'required|numeric',
        ]);

        foreach ($data['tareas'] as $t) {
            Tarea::where('id', $t['id'])
                ->where('usuario_id', $request->user()->id)
                ->update([
                    'columna' => $t['columna'],
                    'orden' => $t['orden']
                ]);
        }

        return response()->json(['success' => true]);
    }

    public function storeSubtarea(Request $request, Tarea $tarea)
    {
        abort_unless($tarea->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'descripcion' => 'required|string|max:255',
        ]);

        $subtarea = $tarea->subtareas()->create([
            'descripcion' => $data['descripcion'],
            'completado' => false,
        ]);

        return response()->json($subtarea, 201);
    }

    public function updateSubtarea(Request $request, TareaSubtarea $subtarea)
    {
        abort_unless($subtarea->tarea->usuario_id === $request->user()->id, 403);

        $data = $request->validate([
            'descripcion' => 'sometimes|string|max:255',
            'completado' => 'sometimes|boolean',
        ]);

        $subtarea->update($data);

        return response()->json($subtarea);
    }

    public function destroySubtarea(Request $request, TareaSubtarea $subtarea)
    {
        abort_unless($subtarea->tarea->usuario_id === $request->user()->id, 403);

        $subtarea->delete();

        return response()->json(['success' => true]);
    }
}
