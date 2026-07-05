<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SesionPomodoro extends Model
{
    protected $table = 'sesiones_pomodoro';

    protected $fillable = [
        'usuario_id',
        'materia_id',
        'duracion_segundos',
        'completada_en',
        'estado',
    ];

    protected $casts = [
        'completada_en' => 'datetime',
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
