<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RelatedAccountController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()
            ->relatedAccounts()
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

        $account = $request->user()->relatedAccounts()->create($data);

        return response()->json($account, 201);
    }
}
