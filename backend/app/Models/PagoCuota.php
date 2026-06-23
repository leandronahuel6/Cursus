<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoCuota extends Model
{
    protected $table = 'pagos_cuota';

    protected $fillable = [
        'usuario_id',
        'periodo',
        'fecha_pago',
    ];

    protected $casts = [
        'fecha_pago' => 'date:Y-m-d',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
