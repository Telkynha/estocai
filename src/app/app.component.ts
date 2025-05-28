import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatToolbarModule
]
})
export class AppComponent implements OnInit {
  isExpanded = true;
  isDarkTheme = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { 

  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkTheme = savedTheme === 'dark';
      this.applyTheme();
    }
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
      this.applyTheme();
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.querySelector('body');
      if (body) {
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(this.isDarkTheme ? 'dark-theme' : 'light-theme');
      }
    }
  }
}