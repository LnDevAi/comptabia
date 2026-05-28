import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final notifier = ref.read(authProvider.notifier);
    final success = await notifier.login(
      _emailCtrl.text.trim(),
      _passwordCtrl.text,
    );
    if (success && mounted) {
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              SizedBox(height: size.height * 0.08),
              // Logo et titre
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.account_balance,
                  color: Colors.white,
                  size: 44,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'ComptaBIA IA',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'Analyse financière intelligente',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              SizedBox(height: size.height * 0.06),

              // Formulaire
              Card(
                elevation: 3,
                shadowColor: AppTheme.cardShadow,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Connexion',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Accédez à votre espace d\'analyse',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 24),

                        // Email
                        TextFormField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Adresse e-mail',
                            prefixIcon: Icon(Icons.email_outlined),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return 'Veuillez saisir votre e-mail';
                            }
                            if (!v.contains('@')) {
                              return 'Adresse e-mail invalide';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        // Mot de passe
                        TextFormField(
                          controller: _passwordCtrl,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          decoration: InputDecoration(
                            labelText: 'Mot de passe',
                            prefixIcon: const Icon(Icons.lock_outline),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () => setState(
                                () => _obscurePassword = !_obscurePassword,
                              ),
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return 'Veuillez saisir votre mot de passe';
                            }
                            if (v.length < 6) {
                              return 'Minimum 6 caractères';
                            }
                            return null;
                          },
                        ),

                        // Erreur
                        if (authState.error != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.error.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: AppTheme.error.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    color: AppTheme.error, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    authState.error!,
                                    style: const TextStyle(
                                      color: AppTheme.error,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Bouton connexion
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: authState.isLoading ? null : _submit,
                            child: authState.isLoading
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                : const Text('Se connecter'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),
              // Footer
              Text(
                '© 2026 E-Défence — Plateforme SaaS comptabilité IA',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontSize: 12,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
