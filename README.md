</br>
<p align="center">
 <img alt='Codebot' src='./assets/logo-codebot.png' href="https://github.com/douglasgomes98/codebot" />
<p align="center"> Code generator by templates. </p>
</p>
## About
#
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

### Changing the configurations

1. Creates this file "codebot.config.json"

```
{
  "templateFolderPath": "src/templates"
}
```
