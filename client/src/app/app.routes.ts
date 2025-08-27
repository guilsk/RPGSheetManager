import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		redirectTo: '/characters',
		pathMatch: 'full'
	},
	{
		path: 'characters',
		loadComponent: () => import('./pages/characters/characters.component')
			.then(m => m.CharactersComponent),
		canActivate: [authGuard]
	},
	{
		path: 'systems',
		loadComponent: () => import('./pages/systems/systems.component')
			.then(m => m.SystemsComponent),
		canActivate: [authGuard]
	},
	{
		path: 'campaigns',
		loadComponent: () => import('./pages/campaigns/campaigns.component')
			.then(m => m.CampaignsComponent),
		canActivate: [authGuard]
	}
];
