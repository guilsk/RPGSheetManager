import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		redirectTo: '/characters',
		pathMatch: 'full'
	},
	{
		path: 'characters',
		loadComponent: () => import('./features/pages/characters/characters.component')
			.then(m => m.CharactersComponent),
		canActivate: [authGuard]
	},
	{
		path: 'systems',
		loadComponent: () => import('./features/pages/systems/systems.component')
			.then(m => m.SystemsComponent),
		canActivate: [authGuard]
	},
	{
		path: 'campaigns',
		loadComponent: () => import('./features/pages/campaigns/campaigns.component')
			.then(m => m.CampaignsComponent),
		canActivate: [authGuard]
	}
];
