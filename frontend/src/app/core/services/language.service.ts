import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'fr' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'comptabia_lang';

  constructor(private translate: TranslateService) {}

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Lang | null;
    const lang: Lang = saved ?? 'fr';
    this.translate.addLangs(['fr', 'en']);
    this.translate.setDefaultLang('fr');
    this.translate.use(lang);
  }

  current(): Lang {
    return (this.translate.currentLang as Lang) ?? 'fr';
  }

  toggle() {
    this.use(this.current() === 'fr' ? 'en' : 'fr');
  }

  use(lang: Lang) {
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }
}
