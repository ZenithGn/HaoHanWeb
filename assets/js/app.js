const menu = document.querySelector('#mobile-menu')
const menuLinks = document.querySelector('.navbar_menu')

const mobilem = () => {
    menu.classList.toggle('is-active')
    menuLinks.classList.toggle('active')
}

menu.addEventListener('click', mobilem);

const accordion = document.getElementsByClassName('container');

for (i=0; i<accordion.length; i++) {
  accordion[i].addEventListener('click', function () {
    this.classList.toggle('active')
  })
}

window.addEventListener('animation', ()=>{
	let content =document.querySelector ('.container');
	let contentPosition = content.getBoundigClientReact().top;
	let screenPosition = window.innerHeight;
	if(contentPosition < screenPosition){
		content.classList.add('active');
	}
});

document.getElementById("music").volume = 0.5; 
