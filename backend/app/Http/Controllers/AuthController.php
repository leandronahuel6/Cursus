<?php

namespace App\Http\Controllers;

use App\Mail\ContactMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;

class AuthController extends Controller
{
    //busca el usuario por email, verifica la contraseña con Hash::check (esta encriptada), 
    //y si esta bien crea un token de Sanctum que el front va a usar en cada request siguiente.
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        // crea un usuario nuevo con rol general por defecto 
        //(los admin no se registran solos,hay que cargarlos a mano)
        $request->validate([
            'nombre' => 'required|string|max:255',
            'legajo' => 'required|digits:5|unique:users,legajo',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
        ], [
            'legajo.required' => 'El legajo es obligatorio.',
            'legajo.digits'   => 'El legajo debe ser un número de 5 dígitos.',
            'legajo.unique'   => 'El legajo ya está registrado.',
            'email.unique'    => 'El email ya está registrado.',
        ]);

        $user = User::create([
            'nombre' => $request->nombre,
            'legajo' => $request->legajo,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'general',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
        } catch (\Throwable) {
            // No bloqueamos el registro si el mail falla
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {   
        // borra el token actual, cerrando la sesion.
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Te enviamos un email con el link para restablecer tu contraseña.']);
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Contraseña actualizada correctamente.']);
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'legajo' => 'nullable|string|max:255|unique:users,legajo,' . $user->id,
            'email' => 'required|email|unique:users,email,' . $user->id,
            'bg_preset' => 'required|string|in:none,utn-haedo,utn-building,study-cozy,code-abstract,lofi-room,custom',
            'bg_opacity' => 'required|integer|min:0|max:30',
            'bg_blur' => 'required|numeric|min:0|max:8',
        ]);

        $user->update($data);

        return response()->json($user);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json($user);
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return response()->json($user);
    }

    public function updateCustomBg(Request $request)
    {
        $request->validate([
            'background' => 'required|image|mimes:png,jpg,jpeg|max:4096',
        ]);

        $user = $request->user();

        if ($user->bg_custom_path) {
            Storage::disk('public')->delete($user->bg_custom_path);
        }

        $path = $request->file('background')->store('backgrounds', 'public');
        $user->update(['bg_custom_path' => $path]);

        return response()->json($user);
    }

    public function deleteCustomBg(Request $request)
    {
        $user = $request->user();

        if ($user->bg_custom_path) {
            Storage::disk('public')->delete($user->bg_custom_path);
            $user->update(['bg_custom_path' => null]);
        }

        return response()->json($user);
    }

    public function changePassword(Request $request){
        $request->validate([
        'current_password' => 'required',
        'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual es incorrecta.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function contact(Request $request)
    {
        $data = $request->validate([
            'tipo'             => 'required|string|max:50',
            'asunto'           => 'required|string|max:255',
            'descripcion'      => 'required|string|max:2000',
            'remitente_nombre' => 'required|string|max:255',
            'remitente_email'  => 'required|email|max:255',
        ]);

        // Grabar el mensaje en la base de datos (Requisito examen)
        ContactMessage::create($data);

        Mail::to(config('mail.from.address'))
            ->send(new ContactMail(
                $data['tipo'],
                $data['asunto'],
                $data['descripcion'],
                $data['remitente_nombre'],
                $data['remitente_email'],
            ));

        return response()->json(['message' => 'Mensaje enviado correctamente.']);
    }
}
