<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class InstitutionController extends Controller
{
    public function users(Request $request)
    {
        $user = $this->authUser($request);
        
        if (!$user->institution) {
            return response()->json([]);
        }
        
        return User::where('institution', $user->institution)
            ->where('id', '!=', $user->id)
            ->orderByRaw('CASE WHEN role = "teacher" THEN 0 ELSE 1 END')
            ->limit(3)
            ->get();
    }
}

