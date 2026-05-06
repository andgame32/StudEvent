<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

abstract class Controller
{
    protected function authUser(Request $request): User
    {
        $user = $request->user('sanctum') ?? $request->user();

        abort_unless($user instanceof User, 401, 'Unauthenticated');

        return $user;
    }
}
