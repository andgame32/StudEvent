<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FriendController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = $this->authUser($request);
        $data = $request->validate(['query' => 'required|string|max:255']);

        $query = trim($data['query']);
        $friend = User::where('email', 'like', "%{$query}%")
            ->orWhere('name', 'like', "%{$query}%")
            ->orderByRaw("CASE WHEN email = ? OR name = ? THEN 0 ELSE 1 END", [$query, $query])
            ->firstOrFail();

        abort_if($friend->id === $user->id, 422, 'Нельзя добавить себя в друзья.');

        Friendship::firstOrCreate(['user_id' => $user->id, 'friend_id' => $friend->id]);
        Friendship::firstOrCreate(['user_id' => $friend->id, 'friend_id' => $user->id]);

        return response()->json(['message' => 'Друг добавлен']);
    }
}
