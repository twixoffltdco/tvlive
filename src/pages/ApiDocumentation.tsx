import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Key, Webhook, Gift, Users, BarChart, Globe, Scissors } from "lucide-react";

const ApiDocumentation = () => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "aqeleulwobgamdffkfri";
  const baseUrl = `https://${projectId}.supabase.co/rest/v1`;
  const functionsUrl = `https://${projectId}.supabase.co/functions/v1`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Code className="w-10 h-10 text-primary" />
            StreamLiveTV API
          </h1>
          <p className="text-lg text-muted-foreground">
            Документация для партнёров и разработчиков
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="auth">Авторизация</TabsTrigger>
            <TabsTrigger value="channels">Каналы</TabsTrigger>
            <TabsTrigger value="public-api">Open API</TabsTrigger>
            <TabsTrigger value="roulette">Рулетка</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Введение</CardTitle>
                <CardDescription>
                  StreamLiveTV API позволяет интегрировать функции платформы в ваши приложения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Базовый URL</h3>
                  <code className="block bg-muted p-3 rounded-lg text-sm font-mono">{baseUrl}</code>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Open API (без авторизации)</h3>
                  <code className="block bg-muted p-3 rounded-lg text-sm font-mono">{functionsUrl}/public-channels</code>
                  <p className="text-sm text-muted-foreground mt-1">Публичный эндпоинт для получения списка каналов без необходимости API ключа</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Возможности API</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Globe className="w-5 h-5 text-primary" />
                      <span>Открытый API каналов</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                      <span>Управление подписчиками</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Gift className="w-5 h-5 text-secondary" />
                      <span>Система призов рулетки</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Scissors className="w-5 h-5 text-accent" />
                      <span>Клипы каналов</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Авторизация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">API Ключи</h3>
                  <p className="text-muted-foreground mb-4">
                    Для доступа к API используйте ключ в заголовке Authorization:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X GET "${baseUrl}/channels" \\
  -H "apikey: YOUR_ANON_KEY" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Open API (без ключа)</h3>
                  <p className="text-muted-foreground mb-4">
                    Эндпоинт public-channels доступен без авторизации:
                  </p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl "${functionsUrl}/public-channels?page=1&limit=20"`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Badge className="mr-2">GET</Badge>
                    Получить список каналов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`GET ${baseUrl}/channels?select=*&is_hidden=eq.false

// Ответ:
[
  {
    "id": "uuid",
    "title": "Мой канал",
    "channel_type": "tv",
    "is_live": true,
    "viewer_count": 150,
    "thumbnail_url": "https://...",
    "created_at": "2026-01-01T00:00:00Z"
  }
]`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    <Badge className="mr-2">GET</Badge>
                    Получить клипы канала
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`GET ${baseUrl}/channel_clips?channel_id=eq.{channel_id}&order=created_at.desc

// Ответ:
[
  {
    "id": "uuid",
    "title": "Лучший момент",
    "clip_url": "https://...",
    "duration": 30,
    "views": 150,
    "created_at": "2026-03-01T12:00:00Z"
  }
]`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="public-api">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Открытый API каналов
                  </CardTitle>
                  <CardDescription>
                    Публичный эндпоинт для внешних сайтов. Не требует авторизации.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Эндпоинт</h3>
                    <code className="block bg-muted p-3 rounded-lg text-sm font-mono">
                      GET {functionsUrl}/public-channels
                    </code>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Параметры запроса</h3>
                    <div className="grid gap-2">
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">page</code>
                        <span className="text-sm text-muted-foreground">Номер страницы (по умолчанию: 1)</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">limit</code>
                        <span className="text-sm text-muted-foreground">Кол-во на страницу (макс: 100, по умолчанию: 50)</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">type</code>
                        <span className="text-sm text-muted-foreground">"tv" или "radio"</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">live</code>
                        <span className="text-sm text-muted-foreground">"true" или "false"</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">category</code>
                        <span className="text-sm text-muted-foreground">UUID категории</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">search</code>
                        <span className="text-sm text-muted-foreground">Поиск по названию</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">sort</code>
                        <span className="text-sm text-muted-foreground">"viewer_count", "created_at", "title"</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                        <code className="text-primary font-mono text-sm">order</code>
                        <span className="text-sm text-muted-foreground">"asc" или "desc"</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Пример запроса</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl "${functionsUrl}/public-channels?type=tv&live=true&sort=viewer_count&order=desc&limit=20"

// Ответ:
{
  "data": [
    {
      "id": "uuid",
      "title": "Мой ТВ канал",
      "description": "Описание канала",
      "thumbnail_url": "https://...",
      "channel_type": "tv",
      "is_live": true,
      "viewer_count": 150,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-03-04T12:00:00Z",
      "category_id": "uuid | null",
      "paid_only": false,
      "donation_url": "https://...",
      "owner": {
        "username": "streamer123",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roulette">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Система рулетки для партнёров
                  </CardTitle>
                  <CardDescription>Интеграция призов от внешних партнёров</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Добавление приза через API</h3>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`POST ${baseUrl}/roulette_prizes

{
  "channel_id": "{channel_id}",
  "title": "Скидка 20% от партнёра",
  "description": "Промокод на скидку",
  "prize_type": "promocode",
  "prize_value": "PARTNER2026",
  "chance_percent": 5.00,
  "is_active": true
}`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Типы призов</h3>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Badge variant="outline">internal</Badge>
                        <span>Баллы канала</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Badge variant="outline">promocode</Badge>
                        <span>Статический промокод</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Badge variant="outline">partner_api</Badge>
                        <span>Динамический промокод через ваш API</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Webhooks
                </CardTitle>
                <CardDescription>Получайте уведомления о событиях в реальном времени</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Доступные события</h3>
                  <div className="grid gap-2">
                    {[
                      { code: "subscription.created", desc: "Новая подписка на канал" },
                      { code: "roulette.spin", desc: "Пользователь прокрутил рулетку" },
                      { code: "premium.purchased", desc: "Покупка премиум подписки" },
                      { code: "channel.live", desc: "Канал начал трансляцию" },
                      { code: "clip.created", desc: "Создан новый клип" },
                    ].map(e => (
                      <div key={e.code} className="p-3 bg-muted rounded-lg">
                        <code className="text-primary">{e.code}</code>
                        <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ApiDocumentation;
