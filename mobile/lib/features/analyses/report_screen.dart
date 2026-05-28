import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:open_file/open_file.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import 'analyses_provider.dart';

class ReportScreen extends ConsumerStatefulWidget {
  final int exercice;
  const ReportScreen({super.key, required this.exercice});

  @override
  ConsumerState<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends ConsumerState<ReportScreen> {
  bool _isExporting = false;
  String? _exportError;
  String? _exportPath;

  Future<void> _exportPdf() async {
    setState(() {
      _isExporting = true;
      _exportError = null;
      _exportPath = null;
    });

    try {
      final client = ref.read(dioClientProvider);
      // Télécharger l'export FEC ou balance en CSV (le backend ne fournit pas encore de PDF des ratios directement)
      final response = await client.dio.get(
        '/api/export/balance',
        queryParameters: {
          'debut': '${widget.exercice}-01-01',
          'fin': '${widget.exercice}-12-31',
        },
        options: Options(responseType: ResponseType.bytes),
      );

      final bytes = response.data as List<int>;
      final dir = await getApplicationDocumentsDirectory();
      final filePath =
          '${dir.path}/rapport_financier_${widget.exercice}.csv';
      final file = File(filePath);
      await file.writeAsBytes(bytes);

      setState(() {
        _exportPath = filePath;
        _isExporting = false;
      });

      await OpenFile.open(filePath);
    } on ApiException catch (e) {
      setState(() {
        _exportError = e.message;
        _isExporting = false;
      });
    } catch (e) {
      setState(() {
        _exportError = 'Erreur lors de l\'export : $e';
        _isExporting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercice = widget.exercice > 0
        ? widget.exercice
        : ref.watch(selectedExerciceProvider);
    final analyseAsync = ref.watch(analysesProvider(exercice));
    final fmtMoney = NumberFormat('#,##0', 'fr_FR');
    final fmtPct = NumberFormat('#,##0.##', 'fr_FR');
    final now = DateFormat('dd/MM/yyyy').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Text('Rapport financier $exercice'),
        actions: [
          IconButton(
            icon: _isExporting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.download_outlined),
            tooltip: 'Exporter',
            onPressed: _isExporting ? null : _exportPdf,
          ),
        ],
      ),
      body: analyseAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline,
                    size: 56, color: AppTheme.textSecondary),
                const SizedBox(height: 16),
                Text(e.toString(),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(analysesProvider(exercice)),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          ),
        ),
        data: (analyse) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Messages d'état export
            if (_exportError != null)
              _StatusBanner(
                message: _exportError!,
                color: AppTheme.error,
                icon: Icons.error_outline,
              ),
            if (_exportPath != null)
              _StatusBanner(
                message: 'Rapport exporté avec succès',
                color: AppTheme.accent,
                icon: Icons.check_circle_outline,
              ),

            // En-tête du rapport
            _ReportHeader(exercice: exercice, dateGeneration: now),
            const SizedBox(height: 20),

            // Section 1 : Score global
            _SectionTitle(
                title: '1. Synthèse de la santé financière',
                icon: Icons.health_and_safety_outlined),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Score global',
                                style: TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontSize: 12),
                              ),
                              Text(
                                '${analyse.scoreGlobal}/100',
                                style: TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.colorForScore(
                                      analyse.scoreGlobal),
                                ),
                              ),
                            ],
                          ),
                        ),
                        _ScoreGauge(score: analyse.scoreGlobal),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...analyse.scoresGroupes.entries.map(
                      (e) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            Expanded(
                                child: Text(e.key,
                                    style:
                                        const TextStyle(fontSize: 13))),
                            Text(
                              '${e.value}/100',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color:
                                    AppTheme.colorForScore(e.value),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Section 2 : Données financières
            _SectionTitle(
                title: '2. Données financières clés',
                icon: Icons.account_balance_outlined),
            Card(
              child: Column(
                children: [
                  _ReportRow(
                      label: 'Total actif',
                      valeur: analyse.totalActif != null
                          ? '${fmtMoney.format(analyse.totalActif)} FCFA'
                          : '—'),
                  _ReportRow(
                      label: "Chiffre d'affaires",
                      valeur: analyse.chiffreAffaires != null
                          ? '${fmtMoney.format(analyse.chiffreAffaires)} FCFA'
                          : '—'),
                  _ReportRow(
                      label: 'Résultat net',
                      valeur: analyse.resultatNet != null
                          ? '${fmtMoney.format(analyse.resultatNet)} FCFA'
                          : '—',
                      highlight: analyse.resultatNet != null
                          ? analyse.resultatNet! >= 0
                          : null),
                  _ReportRow(
                      label: 'Capitaux propres',
                      valeur: analyse.capitauxPropres != null
                          ? '${fmtMoney.format(analyse.capitauxPropres)} FCFA'
                          : '—'),
                  _ReportRow(
                      label: 'Dettes financières',
                      valeur: analyse.dettesFinancieres != null
                          ? '${fmtMoney.format(analyse.dettesFinancieres)} FCFA'
                          : '—'),
                  _ReportRow(
                      label: 'FRNG',
                      valeur: analyse.frng != null
                          ? '${fmtMoney.format(analyse.frng)} FCFA'
                          : '—',
                      highlight: analyse.frng != null
                          ? analyse.frng! >= 0
                          : null),
                  _ReportRow(
                      label: 'BFR',
                      valeur: analyse.bfr != null
                          ? '${fmtMoney.format(analyse.bfr)} FCFA'
                          : '—'),
                  _ReportRow(
                      label: 'Trésorerie nette',
                      valeur: analyse.tresorerieNette != null
                          ? '${fmtMoney.format(analyse.tresorerieNette)} FCFA'
                          : '—',
                      highlight: analyse.tresorerieNette != null
                          ? analyse.tresorerieNette! >= 0
                          : null,
                      isLast: true),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Section 3 : Ratios par groupe
            ...analyse.groupes.asMap().entries.map(
              (entry) {
                final idx = entry.key + 3;
                final groupe = entry.value;
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SectionTitle(
                      title: '$idx. ${groupe.titre}',
                      icon: Icons.analytics_outlined,
                    ),
                    Card(
                      child: Column(
                        children: groupe.ratios.asMap().entries.map(
                          (r) {
                            final ratio = r.value;
                            return _RatioReportRow(
                              ratio: ratio,
                              fmt: fmtPct,
                              isLast: r.key == groupe.ratios.length - 1,
                            );
                          },
                        ).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                );
              },
            ),

            // Footer
            const SizedBox(height: 8),
            Center(
              child: Text(
                'Rapport généré le $now par ComptaBIA IA\n'
                '© 2026 E-Défence — Plateforme SaaS Analyse Financière',
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _ReportHeader extends StatelessWidget {
  final int exercice;
  final String dateGeneration;

  const _ReportHeader({
    required this.exercice,
    required this.dateGeneration,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary, AppTheme.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.picture_as_pdf_outlined,
                  color: Colors.white70, size: 18),
              const SizedBox(width: 8),
              Text(
                'Rapport financier',
                style: const TextStyle(
                    color: Colors.white70, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Exercice $exercice',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Généré le $dateGeneration',
            style: const TextStyle(color: Colors.white60, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionTitle({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.primary, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.primary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportRow extends StatelessWidget {
  final String label;
  final String valeur;
  final bool? highlight;
  final bool isLast;

  const _ReportRow({
    required this.label,
    required this.valeur,
    this.highlight,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    Color? valeurColor;
    if (highlight != null) {
      valeurColor = highlight! ? AppTheme.accent : AppTheme.error;
    }

    return Column(
      children: [
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
              Text(
                valeur,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: valeurColor ?? AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }
}

class _RatioReportRow extends StatelessWidget {
  final RatioFinancier ratio;
  final NumberFormat fmt;
  final bool isLast;

  const _RatioReportRow({
    required this.ratio,
    required this.fmt,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.colorForNiveau(ratio.niveau);

    return Column(
      children: [
        Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ratio.libelle,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (ratio.interpretation != null)
                      Text(
                        ratio.interpretation!,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    ratio.valeur != null
                        ? fmt.format(ratio.valeur)
                        : '—',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      ratio.niveau,
                      style: TextStyle(
                        color: color,
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (!isLast) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    );
  }
}

class _ScoreGauge extends StatelessWidget {
  final int score;
  const _ScoreGauge({required this.score});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.colorForScore(score);
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 6),
        color: color.withOpacity(0.08),
      ),
      child: Center(
        child: Text(
          _label(score),
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  String _label(int score) {
    if (score >= 70) return 'SOLIDE';
    if (score >= 40) return 'MOYEN';
    return 'FRAGILE';
  }
}

class _StatusBanner extends StatelessWidget {
  final String message;
  final Color color;
  final IconData icon;

  const _StatusBanner({
    required this.message,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
