import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../analyses/analyses_provider.dart';
import '../auth/auth_provider.dart';

// ─── Navigation Shell ─────────────────────────────────────────────────────────

final _navIndexProvider = StateProvider<int>((ref) => 0);

class DashboardShell extends ConsumerWidget {
  final Widget child;
  const DashboardShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final idx = ref.watch(_navIndexProvider);

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: idx,
        onTap: (i) {
          ref.read(_navIndexProvider.notifier).state = i;
          switch (i) {
            case 0:
              context.go('/dashboard');
              break;
            case 1:
              context.go('/analyses');
              break;
            case 2:
              context.go('/documents');
              break;
            case 3:
              context.go('/profile');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Tableau de bord',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics),
            label: 'Analyses',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.folder_outlined),
            activeIcon: Icon(Icons.folder),
            label: 'Documents',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}

// ─── Onglet Dashboard ─────────────────────────────────────────────────────────

class DashboardTab extends ConsumerWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exercice = ref.watch(selectedExerciceProvider);
    final kpiAsync = ref.watch(kpiProvider(exercice));
    final authState = ref.watch(authProvider);
    final fmt = NumberFormat('#,##0', 'fr_FR');

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: CustomScrollView(
        slivers: [
          // AppBar
          SliverAppBar(
            pinned: true,
            expandedHeight: 120,
            backgroundColor: AppTheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding:
                  const EdgeInsets.only(left: 16, bottom: 14, right: 16),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bonjour, ${authState.profile?.nom.split(' ').first ?? 'Utilisateur'}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    authState.profile?.nomEntreprise ?? 'ComptaBIA IA',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.primary, AppTheme.primaryLight],
                  ),
                ),
              ),
            ),
            actions: [
              // Sélecteur exercice
              Container(
                margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: exercice,
                    dropdownColor: AppTheme.primary,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    icon: const Icon(Icons.arrow_drop_down,
                        color: Colors.white, size: 18),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    items: List.generate(5, (i) {
                      final y = DateTime.now().year - i;
                      return DropdownMenuItem(
                        value: y,
                        child: Text('$y',
                            style: const TextStyle(color: Colors.white)),
                      );
                    }),
                    onChanged: (v) {
                      if (v != null) {
                        ref.read(selectedExerciceProvider.notifier).state = v;
                      }
                    },
                  ),
                ),
              ),
            ],
          ),

          // Contenu
          SliverToBoxAdapter(
            child: kpiAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => _ErrorCard(message: e.toString()),
              data: (kpi) => _DashboardContent(kpi: kpi, fmt: fmt),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final KpiExecutif kpi;
  final NumberFormat fmt;

  const _DashboardContent({required this.kpi, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section KPI Cards
          Text(
            'Indicateurs financiers — ${kpi.exercice}',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.4,
            children: [
              if (kpi.ca != null)
                _KpiCard(
                  label: "Chiffre d'affaires",
                  valeur: kpi.ca!.valeur,
                  evolutionPct: kpi.ca!.evolutionPct,
                  tendance: kpi.ca!.tendance,
                  unite: kpi.ca!.unite ?? 'FCFA',
                  icon: Icons.trending_up,
                  color: AppTheme.primary,
                  fmt: fmt,
                ),
              if (kpi.charges != null)
                _KpiCard(
                  label: 'Charges totales',
                  valeur: kpi.charges!.valeur,
                  evolutionPct: kpi.charges!.evolutionPct,
                  tendance: kpi.charges!.tendance,
                  unite: kpi.charges!.unite ?? 'FCFA',
                  icon: Icons.payments_outlined,
                  color: AppTheme.error,
                  fmt: fmt,
                ),
              if (kpi.resultatNet != null)
                _KpiCard(
                  label: 'Résultat net',
                  valeur: kpi.resultatNet!.valeur,
                  evolutionPct: kpi.resultatNet!.evolutionPct,
                  tendance: kpi.resultatNet!.tendance,
                  unite: kpi.resultatNet!.unite ?? 'FCFA',
                  icon: Icons.account_balance_wallet_outlined,
                  color: AppTheme.accent,
                  fmt: fmt,
                ),
              if (kpi.tresorerie != null)
                _KpiCard(
                  label: 'Trésorerie nette',
                  valeur: kpi.tresorerie!.valeur,
                  evolutionPct: kpi.tresorerie!.evolutionPct,
                  tendance: kpi.tresorerie!.tendance,
                  unite: kpi.tresorerie!.unite ?? 'FCFA',
                  icon: Icons.savings_outlined,
                  color: AppTheme.primaryLight,
                  fmt: fmt,
                ),
            ],
          ),

          const SizedBox(height: 24),

          // Graphique évolution mensuelle
          if (kpi.tendanceMensuelle.isNotEmpty) ...[
            Text(
              'Évolution mensuelle',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _LegendDot(color: AppTheme.primary, label: "CA"),
                        const SizedBox(width: 16),
                        _LegendDot(
                            color: AppTheme.error, label: "Charges"),
                        const SizedBox(width: 16),
                        _LegendDot(
                            color: AppTheme.accent, label: "Résultat"),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 200,
                      child: _TendanceLineChart(
                          moisData: kpi.tendanceMensuelle),
                    ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Alertes
          if (kpi.alertes.isNotEmpty) ...[
            Text(
              'Alertes & recommandations',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            ...kpi.alertes.map((a) => _AlerteCard(alerte: a)),
          ],

          const SizedBox(height: 80),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final double? valeur;
  final double evolutionPct;
  final String tendance;
  final String unite;
  final IconData icon;
  final Color color;
  final NumberFormat fmt;

  const _KpiCard({
    required this.label,
    required this.valeur,
    required this.evolutionPct,
    required this.tendance,
    required this.unite,
    required this.icon,
    required this.color,
    required this.fmt,
  });

  @override
  Widget build(BuildContext context) {
    final isUp = tendance == 'UP';
    final isDown = tendance == 'DOWN';
    final evColor = isUp ? AppTheme.accent : (isDown ? AppTheme.error : AppTheme.textSecondary);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: evColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isUp
                            ? Icons.arrow_upward
                            : isDown
                                ? Icons.arrow_downward
                                : Icons.remove,
                        color: evColor,
                        size: 10,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${evolutionPct.abs().toStringAsFixed(1)}%',
                        style: TextStyle(
                          color: evColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              valeur != null ? fmt.format(valeur) : '—',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                    fontSize: 15,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 11,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _TendanceLineChart extends StatelessWidget {
  final List<MoisData> moisData;
  const _TendanceLineChart({required this.moisData});

  @override
  Widget build(BuildContext context) {
    final caSpots = <FlSpot>[];
    final chargesSpots = <FlSpot>[];
    final resultatSpots = <FlSpot>[];

    for (int i = 0; i < moisData.length; i++) {
      final m = moisData[i];
      caSpots.add(FlSpot(i.toDouble(), m.ca / 1000000));
      chargesSpots.add(FlSpot(i.toDouble(), m.charges / 1000000));
      resultatSpots.add(FlSpot(i.toDouble(), m.resultat / 1000000));
    }

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (_) => FlLine(
            color: AppTheme.divider,
            strokeWidth: 1,
          ),
        ),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) {
                return Text(
                  '${value.toStringAsFixed(0)}M',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textSecondary,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= moisData.length) return const Text('');
                return Text(
                  moisData[idx].label.substring(0, 3),
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textSecondary,
                  ),
                );
              },
            ),
          ),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          _lineBar(caSpots, AppTheme.primary),
          _lineBar(chargesSpots, AppTheme.error),
          _lineBar(resultatSpots, AppTheme.accent),
        ],
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            tooltipRoundedRadius: 8,
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((s) {
                return LineTooltipItem(
                  '${s.y.toStringAsFixed(2)}M',
                  TextStyle(color: s.bar.color, fontSize: 12),
                );
              }).toList();
            },
          ),
        ),
      ),
    );
  }

  LineChartBarData _lineBar(List<FlSpot> spots, Color color) {
    return LineChartBarData(
      spots: spots,
      isCurved: true,
      color: color,
      barWidth: 2.5,
      isStrokeCapRound: true,
      dotData: const FlDotData(show: false),
      belowBarData: BarAreaData(
        show: true,
        color: color.withOpacity(0.05),
      ),
    );
  }
}

class _AlerteCard extends StatelessWidget {
  final Alerte alerte;
  const _AlerteCard({required this.alerte});

  Color get _color {
    switch (alerte.niveau) {
      case 'DANGER':
        return AppTheme.error;
      case 'WARNING':
        return AppTheme.warning;
      default:
        return AppTheme.niveauInfo;
    }
  }

  IconData get _icon {
    switch (alerte.niveau) {
      case 'DANGER':
        return Icons.dangerous_outlined;
      case 'WARNING':
        return Icons.warning_amber_outlined;
      default:
        return Icons.info_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.07),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _color.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          Icon(_icon, color: _color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              alerte.message,
              style: TextStyle(
                color: _color.withOpacity(0.9),
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: AppTheme.textSecondary)),
      ],
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  const _ErrorCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined,
                size: 56, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            Text(
              'Impossible de charger les données',
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
