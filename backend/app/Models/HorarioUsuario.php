<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HorarioUsuario extends Model
{
    protected $table = 'horarios_usuarios';

    protected $fillable = [
        'usuario_id',
        'tipo',
        'materia_id',
        'titulo_actividad',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'color',
        'version',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }
}
