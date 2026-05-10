<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RelatedAccountController extends Controller
{
    public function index(Request $request)
    {
        $user = $this->authUser($request);
        
        return $user
            ->relatedAccounts()
            ->whereHas('user', function ($query) use ($user) {
                $query->where('institution', $user->institution);
            })
            ->latest()
            ->limit(3)
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
        ]);

        $account = $this->authUser($request)->relatedAccounts()->create($data);

        return response()->json($account, 201);
    }
}
