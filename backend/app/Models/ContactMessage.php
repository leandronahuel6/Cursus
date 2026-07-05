<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['tipo', 'asunto', 'descripcion', 'remitente_nombre', 'remitente_email'])]
class ContactMessage extends Model
{
    //
}
