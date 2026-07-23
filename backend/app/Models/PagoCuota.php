<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoCuota extends Model
{
    protected $table = 'pagos_cuota';

    protected $fillable = [
        'usuario_id',
        'periodo',
        'estado',
        'medio_pago',
        'monto_base',
        'monto_exigible',
        'monto_declarado',
        'fecha_pago',
        'comprobante_path',
        'comprobante_mime',
        'datos_extraidos_ia',
        'eliminado_por',
        'motivo_eliminacion',
        'confirmado_por',
        'confirmado_en',
    ];

    protected $casts = [
        'fecha_pago' => 'date:Y-m-d',
        'datos_extraidos_ia' => 'array',
        'confirmado_en' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function eliminadoPor()
    {
        return $this->belongsTo(User::class, 'eliminado_por');
    }

    public function confirmadoPor()
    {
        return $this->belongsTo(User::class, 'confirmado_por');
    }
}
