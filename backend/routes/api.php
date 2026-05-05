<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\RelatedAccountController;
use App\Http\Controllers\StreamController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/streams', [StreamController::class, 'index']);
Route::get('/streams/now', [StreamController::class, 'now']);
Route::get('/streams/upcoming', [StreamController::class, 'upcoming']);
Route::get('/streams/{stream}', [StreamController::class, 'show']);
Route::get('/streams/{stream}/signal/offer', [StreamController::class, 'getOffer']);
Route::get('/streams/{stream}/signal/answer', [StreamController::class, 'getAnswer']);
Route::get('/streams/{stream}/signal/candidates', [StreamController::class, 'getCandidates']);
Route::post('/streams/{stream}/signal/offer', [StreamController::class, 'saveOffer']);
Route::post('/streams/{stream}/signal/answer', [StreamController::class, 'saveAnswer']);
Route::post('/streams/{stream}/signal/candidates', [StreamController::class, 'addCandidate']);
Route::get('/streams/{stream}/messages', [ChatController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/my-streams', [StreamController::class, 'my']);
    Route::post('/streams', [StreamController::class, 'store']);
    Route::put('/streams/{stream}', [StreamController::class, 'update']);
    Route::delete('/streams/{stream}', [StreamController::class, 'destroy']);
    Route::post('/streams/{stream}/messages', [ChatController::class, 'store']);
    Route::get('/related-accounts', [RelatedAccountController::class, 'index']);
    Route::post('/related-accounts', [RelatedAccountController::class, 'store']);
});
