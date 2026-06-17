<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carrera extends Model
{
    protected $fillable = [
    'nombre'
    ];

    public function materias(){
        return $this->hasMany(Materia::class);
    }
}
