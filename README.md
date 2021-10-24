# Codebot - Code generator by templates
#### This extension creates automated codes based on custom created templates.

### Para utilizar a extensão é necessário seguir alguns passos:

1. Criar uma pasta na raiz do projeto. (O local poderá ser alterado nas configurações).
2. Criar os arquivos de templates utilizando [handlebarsjs](https://handlebarsjs.com/).
3. Para cada tipo de template deverá ser criado uma sub pasta dentro da pasta templates contendo os arquivos necessários para criação de um componente. Como o exemplo a seguir.

```
├─ src
├─ templates
│  ├─ ComponentSass
│  │  ├─ ComponentSass.module.scss.hbs
│  │  ├─ ComponentSass.tsx.hbs
│  │  └─ index.tsx.hbs
│  └─ ComponentSyled
│     ├─ index.tsx.hbs
│     └─ styles.ts.hbs
└── workspace
```
### Modificando as configurações

1. Crie um arquivo "codebot.config.json"

```
{
  "templateFolderPath": "src/templates"
}
```


