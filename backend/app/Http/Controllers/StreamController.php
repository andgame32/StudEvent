<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Models\StreamReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StreamController extends Controller
{
    private function signalMap($value): array
    {
        if (is_array($value)) return $value;
        if (!$value) return [];
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function ensureCanAccessStream(Request $request, Stream $stream): void
    {
        $user = $this->authUser($request);

        if ($user->is_admin || $user->id === $stream->user_id) {
            return;
        }

        abort_unless(
            $stream->institution && $user->institution === $stream->institution,
            403,
            'Stream is available only for users from the same institution'
        );
    }
    public function index(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        return Stream::with('user:id,name,avatar_path,institution')
            ->when(!$user, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($user && !$user->is_admin, function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('institution', $user->institution)
                        ->orWhere('user_id', $user->id);
                });
            })
            ->orderBy('scheduled_at')
            ->get();
    }

    public function now(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        return Stream::with('user:id,name,avatar_path,institution')
            ->when(!$user, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($user && !$user->is_admin, function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('institution', $user->institution)
                        ->orWhere('user_id', $user->id);
                });
            })
            ->where('status', 'live')
            ->orderByDesc('scheduled_at')
            ->get();
    }

    public function upcoming(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user();

        return Stream::with('user:id,name,avatar_path,institution')
            ->when(!$user, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($user && !$user->is_admin, function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('institution', $user->institution)
                        ->orWhere('user_id', $user->id);
                });
            })
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

        $data['institution'] = $user->institution;

        $stream = $user->streams()->create($data);

        return response()->json($stream->load('user:id,name,avatar_path,institution'), 201);
    }

    private function streamPayload(Request $request, Stream $stream): Stream
    {
        $stream->load(['user:id,name,avatar_path,institution', 'messages.user:id,name,avatar_path']);

        $user = $this->authUser($request);
        $stream->setAttribute(
            'current_user_reaction',
            $stream->reactions()
                ->where('user_id', $user->id)
                ->value('reaction')
        );

        return $stream;
    }

    public function show(Request $request, Stream $stream)
    {
        $this->ensureCanAccessStream($request, $stream);

        return $this->streamPayload($request, $stream);
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

        if (($data['status'] ?? null) === 'ended') {
            $data['host_offer'] = null;
            $data['viewer_answer'] = null;
            $data['host_ice_candidates'] = null;
            $data['viewer_ice_candidates'] = null;
        }

        $stream->update($data);

        return response()->json($this->streamPayload($request, $stream->fresh()));
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
        $this->ensureCanAccessStream($request, $stream);

        $data = $request->validate(['reaction' => 'required|in:like,dislike']);

        StreamReaction::updateOrCreate(
            ['stream_id' => $stream->id, 'user_id' => $this->authUser($request)->id],
            ['reaction' => $data['reaction']]
        );

        return response()->json($this->streamPayload($request, $stream->fresh()));
    }

    public function saveOffer(Request $request, Stream $stream): JsonResponse
    {
        if ($this->authUser($request)->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $data = $request->validate([
            'viewer_id' => 'required|string|max:128',
            'sdp' => 'required|string',
        ]);

        $answers = $this->signalMap($stream->host_offer);
        $answers[$data['viewer_id']] = $data['sdp'];

        $stream->update([
            'host_offer' => json_encode($answers),
            'status' => 'live',
        ]);

        return response()->json(['message' => 'Offer saved']);
    }

    public function getOffer(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureCanAccessStream($request, $stream);
        $viewerId = (string) $request->query('viewer_id', '');
        $answers = $this->signalMap($stream->host_offer);
        return response()->json(['sdp' => $viewerId ? ($answers[$viewerId] ?? null) : null]);
    }

    public function saveAnswer(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureCanAccessStream($request, $stream);
        abort_if($stream->status === 'ended', 409, 'Stream has ended');

        $data = $request->validate([
            'viewer_id' => 'required|string|max:128',
            'sdp' => 'required|string',
        ]);
        $offers = $this->signalMap($stream->viewer_answer);
        $offers[$data['viewer_id']] = $data['sdp'];
        $stream->update(['viewer_answer' => json_encode($offers)]);

        return response()->json(['message' => 'Answer saved']);
    }

    public function getAnswer(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureCanAccessStream($request, $stream);
        $viewerId = (string) $request->query('viewer_id', '');
        $offers = $this->signalMap($stream->viewer_answer);
        if (!$viewerId) return response()->json(['offers' => $offers]);
        $sdp = $offers[$viewerId] ?? null;
        if ($sdp) {
            unset($offers[$viewerId]);
            $stream->update(['viewer_answer' => json_encode($offers)]);
        }
        return response()->json(['sdp' => $sdp]);
    }

    public function addCandidate(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureCanAccessStream($request, $stream);
        abort_if($stream->status === 'ended', 409, 'Stream has ended');

        $data = $request->validate([
            'role' => 'required|in:host,viewer',
            'viewer_id' => 'required|string|max:128',
            'candidate' => 'required|array',
        ]);

        if ($data['role'] === 'host' && $this->authUser($request)->id !== $stream->user_id) {
            abort(403, 'Forbidden');
        }

        $field = $data['role'] === 'host' ? 'host_ice_candidates' : 'viewer_ice_candidates';
        $existing = $this->signalMap($stream->{$field});
        $viewerId = $data['viewer_id'];
        $existing[$viewerId] = $existing[$viewerId] ?? [];
        $existing[$viewerId][] = $data['candidate'];

        $stream->update([$field => json_encode($existing)]);

        return response()->json(['message' => 'Candidate added']);
    }

    public function getCandidates(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureCanAccessStream($request, $stream);
        $role = $request->query('role', 'viewer');
        $viewerId = (string) $request->query('viewer_id', '');
        $field = $role === 'host' ? 'host_ice_candidates' : 'viewer_ice_candidates';
        $existing = $this->signalMap($stream->{$field});
        $candidates = $viewerId ? ($existing[$viewerId] ?? []) : [];

        if ($viewerId && !empty($candidates)) {
            $existing[$viewerId] = [];
            $stream->update([$field => json_encode($existing)]);
        }

        return response()->json(['candidates' => $candidates]);
    }
}
