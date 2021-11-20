const menu = document.querySelector('#mobile-menu')
const menuLinks = document.querySelector('.navbar_menu')

// display mobile menu
const mobilem = () => {
    menu.classList.toggle('is-active')
    menuLinks.classList.toggle('active')
}

menu.addEventListener('click', mobilem);