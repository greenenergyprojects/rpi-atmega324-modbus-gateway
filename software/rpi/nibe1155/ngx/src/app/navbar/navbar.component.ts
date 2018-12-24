import {Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart, NavigationEnd, Event as NavigationEvent } from '@angular/router';


@Component({
    selector: 'app-navbar-component',
    templateUrl: 'navbar.component.html'
})
export class NavbarComponent implements OnInit {

    public isCollapsed = true;

    public constructor (private activatedRoute: ActivatedRoute, private router: Router) {
    }

    public ngOnInit() {
        this.router.events.subscribe( (evt: NavigationEvent) => {
           if (evt instanceof NavigationStart) {
                console.log('router event', evt);
                this.isCollapsed = true;
           }
        });
        // this.activatedRoute.url.subscribe(url => {
        //     console.log(url);
        // });
    }

}
