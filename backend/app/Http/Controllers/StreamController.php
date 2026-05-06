<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Models\StreamReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StreamController extends Controller
{
    public function index()
    {
        return Stream::with('user:id,name,avatar_path')
            ->orderBy('scheduled_at')
            ->get();
    }

    public function now()
    {
        return Stream::with('user:id,name,avatar_path')
            ->where('status', 'live')
            ->orderByDesc('scheduled_at')
            ->get();
    }

    public function upcoming()
    {
        return Stream::with('user:id,name,avatar_path')
            ->where('status', 'scheduled')
            ->orderBy('scheduled_at')
            ->get();
    }

    public function my(Request $request)
    {
        return $this->authUser($request)->streams()->orderByDesc('created_at')->get();
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->authUser($request);
        abort_if($user->is_blocked, 403, 'Blocked users cannot stream');

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_at' => 'required|date',
            'status' => 'required|in:live,scheduled,ended',
            'preview' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('preview')) {
            $data['preview_path'] = $request->file('preview')->store('previews', 'public');
        }
        unset($data['preview']);

        $stream = $user->streams()->create($data);

        return response()->json($stream->load('user:id,name,avatar_path'), 201);
    }

    public function show(Stream $stream)
    {
        return $stream->load(['user:id,name,avatar_path', 'messages.user:id,name,avatar_path']);
    }

    public function update(Request $request, Stream $stream): JsonResponse
    {
        $user = $this->authUser($request);
        if ($user && !$user->is_admin && $user->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_at' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:live,scheduled,ended',
            'preview' => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('preview')) {
            if ($stream->preview_path) {
                Storage::disk('public')->delete($stream->preview_path);
            }
            $data['preview_path'] = $request->file('preview')->store('previews', 'public');
        }
        unset($data['preview']);

        $stream->update($data);

        return response()->json($stream->fresh()->load('user:id,name,avatar_path'));
    }

    public function destroy(Request $request, Stream $stream): JsonResponse
    {
        if ($this->authUser($request)->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $stream->delete();

        return response()->json(['message' => 'Stream deleted']);
    }

    public function react(Request $request, Stream $stream): JsonResponse
    {
        $data = $request->validate(['reaction' => 'required|in:like,dislike']);

        StreamReaction::updateOrCreate(
            ['stream_id' => $stream->id, 'user_id' => $this->authUser($request)->id],
            ['reaction' => $data['reaction']]
        );

        return response()->json($stream->fresh());
    }

    public function saveOffer(Request $request, Stream $stream): JsonResponse
    {
        if ($this->authUser($request)->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $data = $request->validate(['sdp' => 'required|string']);

        $stream->update([
            'host_offer' => $data['sdp'],
            'viewer_answer' => null,
            'viewer_ice_candidates' => [],
            'status' => 'live',
        ]);

        return response()->json(['message' => 'Offer saved']);
    }

    public function getOffer(Stream $stream): JsonResponse
    {
        return response()->json(['sdp' => $stream->host_offer]);
    }

    public function saveAnswer(Request $request, Stream $stream): JsonResponse
    {
        $data = $request->validate(['sdp' => 'required|string']);
        $stream->update(['viewer_answer' => $data['sdp']]);

        return response()->json(['message' => 'Answer saved']);
    }

    public function getAnswer(Stream $stream): JsonResponse
    {
        return response()->json(['sdp' => $stream->viewer_answer]);
    }

    public function addCandidate(Request $request, Stream $stream): JsonResponse
    {
        $data = $request->validate([
            'role' => 'required|in:host,viewer',
            'candidate' => 'required|array',
        ]);

        if ($data['role'] === 'host' && $this->authUser($request)->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $field = $data['role'] === 'host' ? 'host_ice_candidates' : 'viewer_ice_candidates';
        $existing = $stream->{$field} ?? [];
        $existing[] = $data['candidate'];

        $stream->update([$field => $existing]);

        return response()->json(['message' => 'Candidate added']);
    }

    public function getCandidates(Request $request, Stream $stream): JsonResponse
    {
        $role = $request->query('role', 'viewer');
        $field = $role === 'host' ? 'host_ice_candidates' : 'viewer_ice_candidates';

        return response()->json(['candidates' => $stream->{$field} ?? []]);
    }
}
