import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
	{
		path: '',
		redirectTo: '/characters',
		pathMatch: 'full'
	},
	{
		path: 'callback',
		loadComponent: () => import('./auth/auth-callback.component')
			.then(m => m.AuthCallbackComponent)
	},
	{
		path: 'characters',
		loadComponent: () => import('./features/pages/characters/characters.component')
			.then(m => m.CharactersComponent),
		canActivate: [authGuard]
	},
	{
		path: 'characters/new',
		loadComponent: () => import('./features/pages/characters/character-edit/character-edit.component')
			.then(m => m.CharacterEditComponent),
		canActivate: [authGuard]
	},
	{
		path: 'characters/edit/:id',
		loadComponent: () => import('./features/pages/characters/character-edit/character-edit.component')
			.then(m => m.CharacterEditComponent),
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
