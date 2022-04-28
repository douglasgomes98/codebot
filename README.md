</br>
<p align="center">
 <a target="_blank" href="https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot">
 <img alt='Codebot' src='https://raw.githubusercontent.com/douglasgomes98/codebot/main/assets/logo-codebot.png' />
 </a>
<p align="center"> Code generator by templates. </p>
</p>

## About

<p> Automates the creation of your boilerplate codes with custom templates. </p>

![Creating a component](/assets/codebot.gif)

### Getting started with the templates creation:

1. Creates a new folder in the root of the project.
2. Creates the templates files using [handlebarsjs](https://handlebarsjs.com/).
3. For each type of template should be created a sub folder inside the 'templates' folder, containing the necessary files to the component creation. See the structure example:

```
├─ src
├─ templates
│  ├─ ComponentSassTsx
│  │  ├─ ComponentSass.module.scss.hbs
│  │  ├─ ComponentSass.tsx.hbs
│  │  └─ index.tsx.hbs
│  └─ ComponentStyled
│     ├─ index.tsx.hbs
│     └─ styles.ts.hbs
└── workspace
```

![Template example](/assets/componenthbsexample.png)

### Using the extension:
As in the gif example, you can press the mouse right-click button and select between two options:
1. Create Component: generates all the boilerplate files from scratch
2. Update Component: this brings up the files that don't exist in the folder

### Changing the configurations

1. Creates this file "codebot.config.json"

```
{
  "templateFolderPath": "src/templates"
}
```

Link to the <a target="_blank" href="https://marketplace.visualstudio.com/items?itemName=douglasgomes98.codebot">VSCode extensions marketplace</a>
