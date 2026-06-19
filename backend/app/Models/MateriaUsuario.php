<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MateriaUsuario extends Model
{
    protected $table = 'materia_usuario';

    protected $fillable = [
        'usuario_id',
        'materia_id',
        'estado_historico',
        'cursando_actualmente',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function materia()
    {
        return $this->belongsTo(Materia::class);
    }

    public function notas()
    {
        return $this->hasMany(Nota::class);
    }
}
