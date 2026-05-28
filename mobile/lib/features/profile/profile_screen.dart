import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../auth/auth_provider.dart';
import '../analyses/analyses_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final profile = authState.profile;
    final exercice = ref.watch(selectedExerciceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon profil'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar et infos principales
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Avatar
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        _initiales(profile?.nom ?? 'U'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    profile?.nom ?? '—',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    profile?.email ?? '—',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 10),
                  // Badges rôle et plan
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _Badge(
                        label: profile?.role ?? '—',
                        color: AppTheme.primary,
                      ),
                      if (profile?.plan != null) ...[
                        const SizedBox(width: 8),
                        _Badge(
                          label: profile!.plan!,
                          color: AppTheme.accent,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Section Entreprise
          _SectionHeader(title: 'Mon entreprise'),
          Card(
            child: Column(
              children: [
                _InfoTile(
                  icon: Icons.business_outlined,
                  label: 'Société',
                  value: profile?.nomEntreprise ?? '—',
                ),
                const Divider(height: 1, indent: 56),
                _InfoTile(
                  icon: Icons.location_on_outlined,
                  label: 'Pays',
                  value: profile?.pays ?? '—',
                ),
                if (profile?.typeEntite != null) ...[
                  const Divider(height: 1, indent: 56),
                  _InfoTile(
                    icon: Icons.category_outlined,
                    label: 'Type d\'entité',
                    value: profile!.typeEntite!,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section Application
          _SectionHeader(title: 'Préférences'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.calendar_today_outlined,
                      color: AppTheme.primary),
                  title: const Text('Exercice en cours'),
                  trailing: DropdownButton<int>(
                    value: exercice,
                    underline: const SizedBox.shrink(),
                    items: List.generate(5, (i) {
                      final y = DateTime.now().year - i;
                      return DropdownMenuItem(
                        value: y,
                        child: Text('$y'),
                      );
                    }),
                    onChanged: (v) {
                      if (v != null) {
                        ref
                            .read(selectedExerciceProvider.notifier)
                            .state = v;
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section À propos
          _SectionHeader(title: 'À propos'),
          Card(
            child: Column(
              children: [
                _InfoTile(
                  icon: Icons.info_outline,
                  label: 'Version',
                  value: '1.0.0',
                ),
                const Divider(height: 1, indent: 56),
                _InfoTile(
                  icon: Icons.cloud_outlined,
                  label: 'Serveur API',
                  value: 'api.comptabia.edefence.tech',
                ),
                const Divider(height: 1, indent: 56),
                _InfoTile(
                  icon: Icons.copyright_outlined,
                  label: 'Copyright',
                  value: '© 2026 E-Défence',
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Bouton déconnexion
          SizedBox(
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () => _confirmLogout(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.error,
                side: const BorderSide(color: AppTheme.error),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Se déconnecter'),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _initiales(String nom) {
    final parts = nom.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    if (nom.isNotEmpty) return nom[0].toUpperCase();
    return 'U';
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Se déconnecter'),
        content: const Text(
          'Êtes-vous sûr de vouloir vous déconnecter ? '
          'Votre session sera terminée.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error,
            ),
            child: const Text('Déconnecter'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) {
        context.go('/login');
      }
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: AppTheme.textSecondary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primary.withOpacity(0.7), size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
