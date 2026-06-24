<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nota extends Model
{
        protected $fillable = [
        'materia_usuario_id',
        'tipo',
        'numero',
        'valor',
        'fecha',
    ];

    protected $casts = [
        'valor' => 'float',
    ];

    public function materiaUsuario()
    {
        return $this->belongsTo(MateriaUsuario::class);
    }
}
