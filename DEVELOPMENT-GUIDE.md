# RPG Sheet Manager - Guia de Desenvolvimento

## 📁 Estrutura de Pastas

### Frontend (Angular 19)
```
client/src/app/
├── auth/                  # Autenticação Auth0
├── features/
│   ├── components/        # Componentes específicos de features
│   ├── pages/             # Páginas/Rotas principais
│   │   ├── characters/      # Gestão de personagens
│   │   ├── campaigns/       # Gestão de campanhas
│   │   ├── systems/         # Gestão de sistemas RPG
│   │   └── layout/          # Layout da aplicação
│   └── services/            # Serviços específicos de features
└── shared/
    ├── models/            # Interfaces e tipos
    └── services/          # Serviços compartilhados
```

### Backend (.NET 9)
```
server/RPGSheetManager/
├── RPGSheetManager.API/           # Controllers e configuração da API
├── RPGSheetManager.Application/   # Lógica de negócio e serviços
├── RPGSheetManager.Domain/        # Entidades e regras de domínio
└── RPGSheetManager.Infra/         # Persistência e infraestrutura
```

## 🎯 Padrões de Código

### Angular Components

#### ✅ FAZER:
```typescript
// Componente standalone
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  // Usar inject() ao invés de constructor
  private service = inject(ExampleService);

  // Propriedades públicas primeiro - SEMPRE com 'public'
  public items: Item[] = [];

  // Métodos públicos - SEMPRE com 'public'
  public ngOnInit(): void {
    this.loadItems();
  }

  // Métodos privados por último
  private loadItems(): void {
    // implementação
  }
}
```

#### ❌ NÃO FAZER:
```typescript
// Template inline para componentes complexos
@Component({
  template: `<div>muito código aqui...</div>`
})

// Constructor injection
constructor(private service: ExampleService) {}

// Métodos sem modificador de acesso
ngOnInit() { } // ❌ Sempre usar 'public'
```

### Indentação
- **Tab size: 4 espaços**
- Aplicar em todos os arquivos (.ts, .html, .scss)

### Nomeação de Arquivos

#### ✅ Padrão correto:
- `example.component.ts`
- `example.component.html`
- `example.component.scss`
- `example.service.ts`
- `example.model.ts`

#### ❌ Evitar:
- `ExampleComponent.ts` (PascalCase em nome de arquivo)
- `example-component.ts` (redundante)

### Services

```typescript
@Injectable({
  providedIn: 'root'
})
export class ExampleService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:7111/api';

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}/items`);
  }
}
```

### Models/Interfaces

```typescript
// Use interfaces para dados
export interface Campaign {
  id: string;
  title: string;
  description: string;
  systemId: string;
  masterId: string;
  playerIds: string[];
  activeSession: boolean;
}

// Use tipos para configurações
export type SearchConfig<T> = {
  placeholder: string;
  searchProperty: keyof T;
  debounceTime?: number;
}
```

## 🎨 Padrões de UI

### CSS/SCSS - Padrão BEM

#### ✅ Estrutura BEM:
```scss
@import './shared/styles/variables' as var;

// Block
.search-bar {
  position: relative;
  width: 100%;

  // Element
  &__input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid var.$border-color;

    // Modifier
    &--focused {
      border-color: var.$primary-color;
    }

    &--error {
      border-color: var.$danger-color;
    }
  }

  &__results {
    position: absolute;
    background: white;

    &--visible {
      display: block;
    }
  }

  &__item {
    padding: 12px 16px;
    cursor: pointer;

    &--highlighted {
      background: var.$primary-color;
      color: white;
    }
  }
}
```

#### ✅ HTML com BEM:
```html
<div class="search-bar">
  <input
    class="search-bar__input search-bar__input--focused"
    type="text"
  />
  <div class="search-bar__results search-bar__results--visible">
    <div class="search-bar__item search-bar__item--highlighted">
      Resultado 1
    </div>
  </div>
</div>
```

#### ✅ Usar variáveis CSS + BEM:
```scss
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;

  h1 {
    color: var(--primary-color);
  }
}

.page-content {
  .search-section {
    margin-bottom: 2rem;
    max-width: 400px;
  }

  .actions {
    margin-bottom: 2rem;
    display: flex;
    justify-content: flex-end;
  }
}
```

### Componentes Reutilizáveis

#### ✅ Sempre usar Inputs/Outputs tipados:
```typescript
@Input({ required: true }) items: T[] = [];
@Input() config: SearchConfig<T>;
@Output() resultSelected = new EventEmitter<T>();
```

#### ✅ Usar generics quando apropriado:
```typescript
export class SearchBarComponent<T> {
  // Componente genérico reutilizável
}
```

## 🔧 Comandos de Desenvolvimento

### Iniciar Projeto
```bash
# Ambos (API + Cliente)
.\rpg start

# Apenas API
.\rpg api

# Apenas Cliente
.\rpg client
```

### Para usar sem .\:
```powershell
$env:PATH += ";$PWD"
```

## 🚀 APIs e Backend

### Controllers (.NET)
```csharp
[ApiController]
[Route("api/[controller]")]
public class CampaignsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Campaign>>> GetCampaigns()
    {
        // implementação
    }
}
```

### Domain Models
```csharp
public class Campaign
{
    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("systemId")]
    public string SystemId { get; set; } = string.Empty;
}
```

## 🔍 Boas Práticas

### ✅ SEMPRE FAZER:
- Usar tipos TypeScript estritos
- **Declarar métodos públicos explicitamente com 'public'**
- **Usar indentação de 4 espaços (tab size: 4)**
- **Aplicar padrão BEM no CSS/SCSS**
- Implementar tratamento de erros
- Usar async/await para operações assíncronas
- Seguir convenções de nomeação
- Criar componentes reutilizáveis
- Usar RxJS para streams de dados
- Implementar loading states
- Validar formulários

### ❌ NUNCA FAZER:
- `console.log` em código de produção
- Dados mockados/fixos
- Componentes sem tratamento de erro
- Mutação direta de arrays/objetos
- CSS inline no template
- Lógica complexa no template
- Subscription sem unsubscribe
- **Métodos sem modificador de acesso explícito**
- **Misturar padrões de CSS (evitar classes sem BEM)**

### 🧹 Clean Code:
- Métodos pequenos (máx 20 linhas)
- Nomes descritivos para variáveis
- Comentários apenas quando necessário
- Extrair constantes para valores mágicos
- Usar early return quando possível

## 🎮 Contexto do Projeto

Este é um sistema de gestão de fichas de RPG que permite:
- **Personagens**: Criar/editar fichas com atributos dinâmicos
- **Campanhas**: Gerenciar sessões como mestre ou jogador
- **Sistemas**: Configurar diferentes sistemas de RPG (D&D, Pathfinder, etc.)
- **Usuários**: Autenticação via Auth0

### Stack Técnica:
- **Frontend**: Angular 19 + SCSS + Auth0
- **Backend**: .NET 9 + MongoDB + SignalR
- **Ferramentas**: VS Code + PowerShell scripts
