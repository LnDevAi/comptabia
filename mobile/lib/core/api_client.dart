import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const String kBaseUrl = 'http://api.comptabia.edefence.tech';
const String kTokenKey = 'jwt_token';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class DioClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;

  DioClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: kBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Intercepteur pour ajouter le token JWT
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: kTokenKey);
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          throw _handleError(e);
        },
      ),
    );

    // Intercepteur de logs (debug)
    _dio.interceptors.add(LogInterceptor(
      requestBody: false,
      responseBody: false,
      error: true,
    ));
  }

  ApiException _handleError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return ApiException(
        'Délai de connexion dépassé. Vérifiez votre connexion internet.',
        statusCode: 408,
      );
    }

    if (e.type == DioExceptionType.connectionError) {
      return ApiException(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
        statusCode: 503,
      );
    }

    final response = e.response;
    if (response != null) {
      final statusCode = response.statusCode;
      String message;
      try {
        final data = response.data;
        if (data is Map) {
          message = data['message'] as String? ??
              data['error'] as String? ??
              _defaultMessage(statusCode);
        } else {
          message = _defaultMessage(statusCode);
        }
      } catch (_) {
        message = _defaultMessage(statusCode);
      }
      return ApiException(message, statusCode: statusCode);
    }

    return ApiException('Une erreur inattendue s\'est produite.');
  }

  String _defaultMessage(int? code) {
    switch (code) {
      case 400:
        return 'Requête invalide.';
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return 'Accès refusé.';
      case 404:
        return 'Ressource introuvable.';
      case 422:
        return 'Données invalides.';
      case 500:
        return 'Erreur interne du serveur.';
      default:
        return 'Erreur réseau ($code).';
    }
  }

  Dio get dio => _dio;
}

// Provider global
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

final dioClientProvider = Provider<DioClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return DioClient(storage);
});
